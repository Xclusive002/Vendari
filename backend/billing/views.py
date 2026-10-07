import hashlib
import hmac
import json
import logging
import uuid
import urllib.error
import urllib.parse
import urllib.request
from datetime import timedelta
from decimal import Decimal

from django.conf import settings
from django.core.mail import EmailMultiAlternatives
from django.core import signing
from django.db import IntegrityError, transaction
from django.db.models import Q
from django.utils import timezone
import sentry_sdk
from rest_framework import status
from rest_framework.exceptions import Throttled
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from accounts.models import User
from businesses.models import Business, Membership, StorefrontOrder
from businesses.email_service import send_storefront_sale_email
from invoices.models import Invoice, InvoicePayment
from referrals.models import Commission, Payout
from referrals.fraud import flag_quick_cancellation

from .models import Payment, Plan, Subscription, WebhookEvent, membership_payment_refunded, membership_payment_succeeded
from .serializers import PaystackInitializeSerializer
from .utils import has_feature
from sales.serializers import SaleSerializer
from vendari_api.rate_limits import rate_limited

logger = logging.getLogger(__name__)


class BillingRateLimitedAPIView(APIView):
    rate_limit_scope = 'billing'
    read_limit = 60
    write_limit = 10

    def initial(self, request, *args, **kwargs):
        super().initial(request, *args, **kwargs)
        user_id = str(request.user.pk) if request.user.is_authenticated else ''
        limit = self.write_limit if request.method not in {'GET', 'HEAD', 'OPTIONS'} else self.read_limit
        if rate_limited(
            request,
            self.rate_limit_scope,
            limit=limit,
            window=60,
            identifier=user_id,
        ):
            raise Throttled(detail='Too many requests. Please try again in a minute.')


def send_subscription_success_email(business, plan):
    recipient = business.owner.email
    subject = f'Your Vendari {plan.name.title()} plan is active'
    body = f'''Your Vendari {plan.name.title()} plan is now active.

Business: {business.name}
Plan: {plan.name.title()}
Billing: {plan.interval}

Your premium features are now available in your Vendari dashboard.
Manage your subscription: {settings.DASHBOARD_URL.rstrip('/')}/dashboard/settings/billing

Vendari Support Team
support@vendari.name.ng
'''
    html = f'''<!doctype html><html><body style="margin:0;background:#F7F9FC;color:#0B1220;font-family:Arial,sans-serif;line-height:1.6"><table width="100%" cellspacing="0" cellpadding="0" style="padding:32px 16px;background:#F7F9FC"><tr><td align="center"><table width="100%" cellspacing="0" cellpadding="0" style="max-width:620px;background:#fff;border:1px solid #E3E8F1;border-radius:12px;overflow:hidden"><tr><td style="padding:28px 32px;background:#06122B;color:#fff;font-size:24px;font-weight:700">Vendari</td></tr><tr><td style="padding:32px"><p style="margin:0;color:#16A34A;font-size:12px;font-weight:700;letter-spacing:1.4px;text-transform:uppercase">Payment successful</p><h1 style="color:#06122B;font-size:28px;line-height:1.2">Your {plan.name.title()} plan is active</h1><p>Your payment was confirmed and your premium features are now available.</p><div style="margin:24px 0;padding:16px;border:1px solid #E3E8F1;border-radius:8px;background:#F7F9FC"><strong>Business:</strong> {business.name}<br><strong>Plan:</strong> {plan.name.title()}<br><strong>Billing:</strong> {plan.interval}</div><a href="{settings.DASHBOARD_URL.rstrip('/')}/dashboard/settings/billing" style="display:inline-block;padding:12px 20px;border-radius:8px;background:#4683EC;color:#fff;text-decoration:none;font-weight:700">Open billing</a></td></tr><tr><td style="padding:20px 32px;border-top:1px solid #E3E8F1;color:#8792A2;font-size:12px">Vendari Support Team · support@vendari.name.ng</td></tr></table></td></tr></table></body></html>'''
    message = EmailMultiAlternatives(subject=subject, body=body, from_email=getattr(settings, 'ADMIN_EMAIL_FROM', settings.DEFAULT_FROM_EMAIL), to=[recipient])
    message.attach_alternative(html, 'text/html')
    return message.send(fail_silently=False)


def paystack_request(endpoint, payload=None, method='GET'):
    secret_key = settings.PAYSTACK_SECRET_KEY.strip()
    body = json.dumps(payload).encode() if payload is not None else None
    request = urllib.request.Request(
        f'https://api.paystack.co/{endpoint}', data=body,
        headers={
            'Authorization': f'Bearer {secret_key}',
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'User-Agent': 'Vendari-Payments/1.0',
        },
        method=method,
    )
    try:
        with urllib.request.urlopen(request, timeout=15) as response:
            data = json.loads(response.read())
            if not data.get('status'):
                logger.error('Paystack request rejected: endpoint=%s message=%s', endpoint, data.get('message', 'unknown'))
            return data
    except urllib.error.HTTPError as error:
        response_body = ''
        try:
            response_body = error.read().decode('utf-8', errors='replace')[:300]
        except (json.JSONDecodeError, UnicodeDecodeError):
            pass
        logger.error('Paystack request failed: endpoint=%s status=%s response=%s', endpoint, error.code, response_body or 'unknown')
        return None
    except urllib.error.URLError as error:
        logger.error('Paystack request failed: endpoint=%s network_error=%s', endpoint, error.reason)
        return None
    except json.JSONDecodeError:
        logger.error('Paystack request failed: endpoint=%s invalid_json=true', endpoint)
        return None


class PaystackBanksView(BillingRateLimitedAPIView):
    rate_limit_scope = 'billing-bank-list'
    read_limit = 20

    def get(self, request):
        secret_key = settings.PAYSTACK_SECRET_KEY.strip()
        if not secret_key or secret_key.startswith('your_'):
            return Response({'detail': 'We could not load the bank list. Please try again.'}, status=status.HTTP_503_SERVICE_UNAVAILABLE)
        if not secret_key.startswith(('sk_test_', 'sk_live_')):
            logger.error('Paystack key has an unsupported format: prefix=%s length=%s', secret_key[:3], len(secret_key))
            return Response({'detail': 'We could not load the bank list. Please try again.'}, status=status.HTTP_503_SERVICE_UNAVAILABLE)
        data = paystack_request('bank?country=nigeria')
        if not data or not data.get('status'):
            return Response({'detail': 'We could not load the bank list. Please try again.'}, status=status.HTTP_502_BAD_GATEWAY)
        return Response(data.get('data', []))


class VerifyBankAccountView(BillingRateLimitedAPIView):
    rate_limit_scope = 'billing-bank-verify'
    write_limit = 5

    def post(self, request, business_id):
        if not Membership.objects.filter(user=request.user, business_id=business_id).exists():
            return Response({'detail': 'You must be a member of this business.'}, status=status.HTTP_403_FORBIDDEN)
        bank_code = str(request.data.get('bank_code', '')).strip()
        account_number = str(request.data.get('account_number', '')).strip()
        if not bank_code or not account_number:
            return Response({'detail': 'Bank code and account number are required.'}, status=status.HTTP_400_BAD_REQUEST)
        data = paystack_request(f'bank/resolve?account_number={urllib.parse.quote(account_number)}&bank_code={urllib.parse.quote(bank_code)}')
        if not data or not data.get('status') or not data.get('data', {}).get('account_name'):
            return Response({'detail': 'We could not verify that bank account.'}, status=status.HTTP_400_BAD_REQUEST)
        account_name = data['data']['account_name']
        token = signing.dumps({'business_id': business_id, 'bank_code': bank_code, 'account_number': account_number, 'account_name': account_name})
        return Response({'account_name': account_name, 'verification_token': token})


class CreateSubaccountView(BillingRateLimitedAPIView):
    rate_limit_scope = 'billing-subaccount-create'
    write_limit = 5

    def post(self, request, business_id):
        if not Membership.objects.filter(user=request.user, business_id=business_id).exists():
            return Response({'detail': 'You must be a member of this business.'}, status=status.HTTP_403_FORBIDDEN)
        try:
            verified = signing.loads(request.data.get('verification_token', ''), max_age=600)
        except (signing.BadSignature, TypeError, ValueError):
            return Response({'detail': 'Bank verification has expired. Verify the account again.'}, status=status.HTTP_400_BAD_REQUEST)
        if verified.get('business_id') != business_id or any(verified.get(key) != str(request.data.get(key, '')).strip() for key in ('bank_code', 'account_number')):
            return Response({'detail': 'The bank details do not match the verified account.'}, status=status.HTTP_400_BAD_REQUEST)
        business = Business.objects.get(pk=business_id)
        data = paystack_request('subaccount', {'business_name': business.name, 'settlement_bank': verified['bank_code'], 'account_number': verified['account_number'], 'percentage_charge': float(business.platform_fee_percentage)}, method='POST')
        if not data or not data.get('status') or not data.get('data', {}).get('subaccount_code'):
            return Response({'detail': 'Paystack could not create the business payout account.'}, status=status.HTTP_502_BAD_GATEWAY)
        business.bank_code = verified['bank_code']
        business.bank_account_number = verified['account_number']
        business.bank_account_name = verified['account_name']
        business.paystack_subaccount_code = data['data']['subaccount_code']
        business.save(update_fields=('bank_code', 'bank_account_number', 'bank_account_name', 'paystack_subaccount_code', 'updated_at'))
        return Response({'account_name': business.bank_account_name, 'subaccount_code': business.paystack_subaccount_code})


class InvoicePaymentInitializeView(BillingRateLimitedAPIView):
    rate_limit_scope = 'billing-invoice-payment'
    write_limit = 5

    def post(self, request, business_id, invoice_id):
        if not Membership.objects.filter(user=request.user, business_id=business_id).exists():
            return Response({'detail': 'Invoice not found.'}, status=status.HTTP_404_NOT_FOUND)
        invoice = Invoice.objects.filter(pk=invoice_id, business_id=business_id, status=Invoice.UNPAID).select_related('business', 'customer').first()
        if invoice is None:
            return Response({'detail': 'Invoice not found.'}, status=status.HTTP_404_NOT_FOUND)
        if not has_feature(invoice.business, 'payments'):
            return Response({'detail': 'Online invoice payments are available on a paid plan.'}, status=status.HTTP_403_FORBIDDEN)
        if not invoice.business.paystack_subaccount_code:
            return Response({'detail': 'Complete Payment Settings before offering Pay Now.'}, status=status.HTTP_409_CONFLICT)
        email = invoice.customer.email if invoice.customer and invoice.customer.email else request.user.email
        data = paystack_request('transaction/initialize', {'email': email, 'amount': int(invoice.total * 100), 'currency': 'NGN', 'subaccount': invoice.business.paystack_subaccount_code, 'bearer': 'subaccount', 'metadata': {'payment_type': 'invoice', 'invoice_id': invoice.pk, 'business_id': business_id}}, method='POST')
        if not data or not data.get('status') or not data.get('data', {}).get('authorization_url'):
            return Response({'error': 'Unable to initialize Paystack transaction.'}, status=status.HTTP_502_BAD_GATEWAY)
        return Response({'authorization_url': data['data']['authorization_url'], 'reference': data['data'].get('reference')})


class BillingCheckoutView(BillingRateLimitedAPIView):
    rate_limit_scope = 'billing-checkout'
    write_limit = 5

    permission_classes = [IsAuthenticated]

    def post(self, request):
        interval = str(request.data.get('interval', '') or '').strip().lower()
        if interval not in {Plan.INTERVAL_MONTHLY, Plan.INTERVAL_YEARLY}:
            return Response({'detail': 'Select a valid membership interval.'}, status=status.HTTP_400_BAD_REQUEST)
        plan = Plan.get_membership_plan(interval)
        reference = f'membership_{interval}_{uuid.uuid4().hex}'
        payload = {
            'email': request.user.email,
            'reference': reference,
            'currency': 'NGN',
            'plan': plan.paystack_plan_code,
            'metadata': {'type': 'membership', 'user_id': request.user.pk, 'interval': interval},
        }
        if not plan.paystack_plan_code:
            payload['amount'] = int(plan.amount * 100)
        data = paystack_request('transaction/initialize', payload, method='POST')
        if not data:
            return Response({'error': 'Unable to initialize Paystack transaction.'}, status=status.HTTP_502_BAD_GATEWAY)
        if not data.get('status') or not data.get('data', {}).get('authorization_url'):
            return Response({'error': 'Paystack rejected the transaction.'}, status=status.HTTP_502_BAD_GATEWAY)
        return Response({
            'authorization_url': data['data']['authorization_url'],
            'reference': data['data'].get('reference', reference),
        })


class PaystackInitializeView(BillingRateLimitedAPIView):
    rate_limit_scope = 'billing-paystack-initialize'
    write_limit = 5

    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = PaystackInitializeSerializer(data=request.data, context={'request': request})
        serializer.is_valid(raise_exception=True)
        business = serializer.validated_data['business']
        plan = serializer.validated_data['plan']
        payload = {
            'email': request.user.email,
            'amount': int(plan.amount * 100),
            'currency': 'NGN',
            'callback_url': f'{settings.DASHBOARD_URL.rstrip("/")}/payment/success',
            'metadata': {'business_id': business.pk, 'plan_id': plan.pk, 'billing_interval': plan.interval},
        }
        if plan.paystack_plan_code:
            payload['plan'] = plan.paystack_plan_code
        data = paystack_request('transaction/initialize', payload, method='POST')
        if not data:
            return Response({'error': 'Unable to initialize Paystack transaction.'}, status=status.HTTP_502_BAD_GATEWAY)
        if not data.get('status') or not data.get('data', {}).get('authorization_url'):
            return Response({'error': 'Paystack rejected the transaction.'}, status=status.HTTP_502_BAD_GATEWAY)
        return Response({
            'authorization_url': data['data']['authorization_url'],
            'reference': data['data'].get('reference'),
        })


class PaystackWebhookView(APIView):
    permission_classes = [AllowAny]

    def dispatch(self, request, *args, **kwargs):
        self._webhook_event_record_id = None
        try:
            response = super().dispatch(request, *args, **kwargs)
        except Exception:
            if self._webhook_event_record_id:
                WebhookEvent.objects.filter(
                    pk=self._webhook_event_record_id,
                    processed_at__isnull=True,
                ).update(processing_started_at=None)
            raise
        if self._webhook_event_record_id:
            records = WebhookEvent.objects.filter(
                pk=self._webhook_event_record_id,
                processed_at__isnull=True,
            )
            if response.status_code < status.HTTP_400_BAD_REQUEST:
                records.update(processed_at=timezone.now(), processing_started_at=None)
            else:
                records.update(processing_started_at=None)
        return response

    def handle_exception(self, exc):
        logger.exception('Paystack webhook processing failed')
        sentry_sdk.capture_exception(exc)
        return super().handle_exception(exc)

    def _is_membership_event(self, data, metadata):
        if str(metadata.get('type') or '').lower() == 'membership':
            return True
        if str(metadata.get('payment_type') or '').lower() in {'membership', 'subscription'}:
            return True
        if metadata.get('business_id') and metadata.get('plan_id'):
            return True
        plan_code = str(metadata.get('plan_code') or data.get('plan_code') or data.get('plan') or '').strip()
        if plan_code:
            membership_codes = {str(settings.PAYSTACK_MONTHLY_PLAN_CODE).strip(), str(settings.PAYSTACK_YEARLY_PLAN_CODE).strip()}
            if plan_code in membership_codes and plan_code:
                return True
        if metadata.get('plan_id'):
            plan = Plan.objects.filter(pk=metadata.get('plan_id')).first()
            if plan and (plan.paystack_plan_code or plan.interval in {Plan.INTERVAL_MONTHLY, Plan.INTERVAL_YEARLY}):
                return True
        return False

    def post(self, request):
        secret_key = settings.PAYSTACK_SECRET_KEY.strip()
        if not secret_key:
            logger.error('Rejecting Paystack webhook because PAYSTACK_SECRET_KEY is not configured')
            sentry_sdk.capture_message('Paystack webhook secret is not configured', level='error')
            return Response({'error': 'Webhook verification is unavailable.'}, status=status.HTTP_503_SERVICE_UNAVAILABLE)
        signature = request.headers.get('X-Paystack-Signature', '')
        raw_body = request.body
        expected = hmac.new(
            secret_key.encode(), raw_body, hashlib.sha512,
        ).hexdigest()
        if not signature or not hmac.compare_digest(signature, expected):
            return Response({'error': 'Invalid signature.'}, status=status.HTTP_401_UNAUTHORIZED)
        try:
            payload = json.loads(raw_body)
        except json.JSONDecodeError:
            return Response({'error': 'Invalid JSON payload.'}, status=status.HTTP_400_BAD_REQUEST)
        event = str(payload.get('event') or '')
        data = payload.get('data') or {}
        reference = str(data.get('reference') or '').strip()
        provider_event_id = str(data.get('id') or data.get('event_id') or reference)
        event_id = hashlib.sha256(f'{event}:{provider_event_id}'.encode()).hexdigest() if provider_event_id else ''
        event_record = None
        if event_id or reference:
            try:
                with transaction.atomic():
                    event_record, _ = WebhookEvent.objects.get_or_create(
                        event=event,
                        event_id=event_id or reference,
                        defaults={'reference': reference, 'payload': payload},
                    )
                    event_record = WebhookEvent.objects.select_for_update().get(pk=event_record.pk)
            except IntegrityError:
                event_record = WebhookEvent.objects.filter(event_id=event_id or reference).first()
                if event_record is None:
                    raise
            if event_record.processed_at:
                return Response({'status': 'already_processed'})
            lease_cutoff = timezone.now() - timedelta(minutes=5)
            claimed = WebhookEvent.objects.filter(
                pk=event_record.pk,
                processed_at__isnull=True,
            ).filter(
                Q(processing_started_at__isnull=True)
                | Q(processing_started_at__lt=lease_cutoff)
            ).update(processing_started_at=timezone.now())
            if not claimed:
                return Response(
                    {'status': 'processing'},
                    status=status.HTTP_202_ACCEPTED,
                )
            if event_record.reference != reference:
                event_record.reference = reference
                event_record.payload = payload
                event_record.save(update_fields=['reference', 'payload'])
            self._webhook_event_record_id = event_record.pk
        if event in ('transfer.success', 'transfer.failed', 'transfer.reversed'):
            transfer_reference = str(data.get('reference') or data.get('transfer_code') or '').strip()
            transfer_code = str(data.get('transfer_code') or '').strip()
            payout = None
            if transfer_reference:
                payout = Payout.objects.filter(reference=transfer_reference).first()
            if payout is None and transfer_code:
                payout = Payout.objects.filter(paystack_transfer_code=transfer_code).first()
            if payout is not None:
                if event == 'transfer.success':
                    if payout.status == Payout.STATUS_SUCCESS:
                        return Response({'status': 'already_processed', 'payout_id': payout.pk})
                    payout.status = Payout.STATUS_SUCCESS
                    payout.completed_at = timezone.now()
                    payout.save(update_fields=['status', 'completed_at'])
                    for commission in payout.covered_commissions.all():
                        if commission.status != Commission.STATUS_PAID:
                            commission.status = Commission.STATUS_PAID
                            commission.save(update_fields=['status'])
                    return Response({'status': 'processed', 'payout_status': payout.status})
                if event == 'transfer.failed':
                    if payout.status == Payout.STATUS_FAILED:
                        return Response({'status': 'already_processed', 'payout_id': payout.pk})
                    payout.status = Payout.STATUS_FAILED
                    payout.failure_reason = str(data.get('message') or 'Transfer failed')
                    payout.completed_at = timezone.now()
                    payout.save(update_fields=['status', 'failure_reason', 'completed_at'])
                    return Response({'status': 'processed', 'payout_status': payout.status})
                if event == 'transfer.reversed':
                    if payout.status == Payout.STATUS_REVERSED:
                        return Response({'status': 'already_processed', 'payout_id': payout.pk})
                    payout.status = Payout.STATUS_REVERSED
                    payout.failure_reason = str(data.get('message') or 'Transfer reversed')
                    payout.completed_at = timezone.now()
                    payout.save(update_fields=['status', 'failure_reason', 'completed_at'])
                    for commission in payout.covered_commissions.all():
                        if commission.status == Commission.STATUS_PAID:
                            commission.status = Commission.STATUS_APPROVED
                            commission.save(update_fields=['status'])
                    return Response({'status': 'processed', 'payout_status': payout.status})
            subaccount_code = str(data.get('recipient', {}).get('subaccount_code') or data.get('subaccount_code') or '').strip()
            if not subaccount_code:
                return Response({'status': 'ignored'})
            businesses = Business.objects.filter(paystack_subaccount_code=subaccount_code)
            if not businesses.exists():
                return Response({'status': 'ignored'})
            payout_status = StorefrontOrder.PAYOUT_SETTLED if event == 'transfer.success' else StorefrontOrder.PAYOUT_FAILED
            update_fields = {'payout_status': payout_status}
            if payout_status == StorefrontOrder.PAYOUT_SETTLED:
                update_fields['settled_at'] = timezone.now()
            order_id = data.get('metadata', {}).get('storefront_order_id') or data.get('storefront_order_id')
            transfer_reference = data.get('reference') or data.get('transaction_reference')
            orders = StorefrontOrder.objects.filter(business__in=businesses, status=StorefrontOrder.STATUS_PAID)
            if order_id:
                orders = orders.filter(pk=order_id)
            elif transfer_reference:
                orders = orders.filter(paystack_reference=transfer_reference)
            else:
                logger.warning('Ignoring uncorrelated Paystack transfer event=%s subaccount=%s', event, subaccount_code)
                return Response({'status': 'ignored'})
            orders.update(**update_fields)
            return Response({'status': 'processed', 'payout_status': payout_status})
        if event == 'refund.processed':
            metadata = data.get('metadata') or {}
            refund_reference = str(data.get('reference') or metadata.get('reference') or '').strip()
            payment = Payment.objects.filter(reference=refund_reference).first() if refund_reference else None
            if payment:
                payment.status = 'refunded'
                payment.save(update_fields=['status', 'updated_at'])
                membership_payment_refunded.send(sender=Payment, payment=payment)
            return Response({'status': 'processed'})
        if event == 'invoice.payment_failed':
            return Response({'status': 'ignored'})
        if event == 'subscription.create':
            return Response({'status': 'processed'})
        if event == 'subscription.disable':
            customer = data.get('customer') or {}
            metadata = data.get('metadata') or {}
            customer_email = str(customer.get('email') or data.get('email') or '').strip().lower()
            business_id = metadata.get('business_id')
            business = Business.objects.filter(pk=business_id).select_related('owner').first() if business_id else None
            referred_user = business.owner if business else (
                User.objects.filter(email__iexact=customer_email).first() if customer_email else None
            )
            if referred_user:
                flag_quick_cancellation(referred_user)
                if business:
                    Subscription.objects.filter(
                        business=business,
                    ).update(status=Subscription.STATUS_CANCELLED)
                else:
                    Subscription.objects.filter(
                        business__owner=referred_user,
                    ).update(status=Subscription.STATUS_CANCELLED)
            else:
                logger.warning('Could not identify user for Paystack subscription cancellation event')
            return Response({'status': 'processed'})
        if event != 'charge.success':
            return Response({'status': 'ignored'})
        reference = str(data.get('reference') or '').strip()
        metadata = data.get('metadata') or {}
        if metadata.get('payment_type') == 'invoice':
            invoice = Invoice.objects.filter(pk=metadata.get('invoice_id'), business_id=metadata.get('business_id')).first()
            if invoice is None:
                return Response({'error': 'Invalid invoice metadata.'}, status=status.HTTP_400_BAD_REQUEST)
            with transaction.atomic():
                payment, created = InvoicePayment.objects.get_or_create(paystack_reference=reference, defaults={'invoice': invoice, 'amount': Decimal(data.get('amount', 0)) / Decimal('100')})
                if created and invoice.status != Invoice.PAID:
                    invoice.status = Invoice.PAID
                    invoice.save(update_fields=('status',))
            return Response({'status': 'processed' if created else 'already_processed', 'invoice_id': invoice.pk})
        if metadata.get('payment_type') == 'storefront_order':
            order = StorefrontOrder.objects.filter(
                pk=metadata.get('storefront_order_id'),
                business_id=metadata.get('business_id'),
            ).first()
            if order is None:
                return Response({'error': 'Invalid storefront order metadata.'}, status=status.HTTP_400_BAD_REQUEST)
            if (
                str(data.get('status', '')).lower() != 'success'
                or str(data.get('currency', 'NGN')).upper() != 'NGN'
                or str(reference or '') != str(order.paystack_reference or '')
                or Decimal(str(data.get('amount', 0))) != order.total * Decimal('100')
            ):
                logger.warning('Rejecting invalid storefront payment event for order=%s reference=%s', order.pk, reference)
                return Response({'error': 'Paystack payment could not be verified.'}, status=status.HTTP_400_BAD_REQUEST)
            with transaction.atomic():
                order = StorefrontOrder.objects.select_for_update().prefetch_related('line_items').get(pk=order.pk)
                if order.status == StorefrontOrder.STATUS_PAID:
                    return Response({'status': 'already_processed', 'order_id': order.pk})
                for line in order.line_items.all():
                    serializer = SaleSerializer(data={
                        'item': line.inventory_item_id,
                        'quantity': line.quantity,
                        'payment_method': 'paystack',
                    }, context={'business': order.business, 'storefront_unit_price': line.unit_price, 'storefront_order': order})
                    serializer.is_valid(raise_exception=True)
                    serializer.save()
                order.status = StorefrontOrder.STATUS_PAID
                order.paystack_reference = reference or order.paystack_reference
                order.save(update_fields=('status', 'paystack_reference'))
                send_storefront_sale_email(order.business, order)
            return Response({'status': 'processed', 'order_id': order.pk})
        if not self._is_membership_event(data, metadata):
            return Response({'status': 'ignored'})
        user_id = metadata.get('user_id') or data.get('customer', {}).get('id')
        business_id = metadata.get('business_id')
        plan_id = metadata.get('plan_id')
        if not reference:
            return Response({'error': 'Missing payment reference.'}, status=status.HTTP_400_BAD_REQUEST)
        with transaction.atomic():
            if Payment.objects.filter(reference=reference).exists():
                return Response({'status': 'already_processed'})
            if user_id is not None:
                user = User.objects.filter(pk=user_id).first()
            else:
                user = None
            plan = None
            if plan_id:
                plan = Plan.objects.filter(pk=plan_id).first()
            if plan is None:
                interval = str(metadata.get('interval') or metadata.get('billing_interval') or '').strip().lower()
                if interval not in {Plan.INTERVAL_MONTHLY, Plan.INTERVAL_YEARLY}:
                    interval = Plan.INTERVAL_MONTHLY
                plan = Plan.get_membership_plan(interval)
            verify_response = paystack_request(f'transaction/verify/{urllib.parse.quote(reference)}')
            if verify_response is None:
                logger.error('Paystack verification unavailable for membership reference=%s', reference)
                sentry_sdk.capture_message(
                    'Paystack verification unavailable for membership payment',
                    level='error',
                )
                return Response(
                    {'error': 'Payment verification is temporarily unavailable.'},
                    status=status.HTTP_502_BAD_GATEWAY,
                )
            if not verify_response.get('status') or str(verify_response.get('data', {}).get('status') or '').lower() not in {'success', 'paid'}:
                logger.warning('Paystack verification rejected membership reference=%s', reference)
                return Response({'status': 'ignored'})
            verified_data = verify_response.get('data') or {}
            if (
                str(verified_data.get('reference') or '') != reference
                or str(verified_data.get('currency') or '').upper() != 'NGN'
                or int(verified_data.get('amount') or 0) <= 0
                or int(verified_data.get('amount') or 0) != int(plan.amount * 100)
            ):
                logger.error('Paystack verification data mismatch for membership reference=%s', reference)
                return Response({'error': 'Payment verification did not match the transaction.'}, status=status.HTTP_400_BAD_REQUEST)
            business = None
            if business_id:
                business = Business.objects.filter(pk=business_id).first()
            if business is None and user is not None:
                business = user.businesses.order_by('pk').first()
            if business is None:
                return Response({'error': 'Invalid membership payment metadata.'}, status=status.HTTP_400_BAD_REQUEST)
            if user is None:
                user = business.owner
            renew_days = 365 if plan.interval == plan.INTERVAL_YEARLY else 30
            subscription, _ = Subscription.objects.update_or_create(
                business=business,
                defaults={
                    'plan': plan,
                    'paystack_reference': reference,
                    'status': Subscription.STATUS_ACTIVE,
                    'renews_at': timezone.now() + timedelta(days=renew_days),
                },
            )
            payment = Payment.objects.create(
                provider='paystack',
                user=user,
                business=business,
                reference=reference,
                amount=Decimal(str(verify_response.get('data', {}).get('amount', 0))) / Decimal('100'),
                fee=Decimal(str(verify_response.get('data', {}).get('fees', 0))) / Decimal('100'),
                currency=str(verify_response.get('data', {}).get('currency') or 'NGN'),
                interval=plan.interval,
                status='paid',
                paid_at=timezone.now(),
                metadata={'type': 'membership', 'interval': plan.interval, 'user_id': user.pk if user else user_id},
            )
            business.plan = plan
            business.save(update_fields=('plan', 'updated_at'))
            membership_payment_succeeded.send(sender=Payment, payment=payment)
            try:
                send_subscription_success_email(business, plan)
            except Exception:
                logger.exception('Subscription confirmation email failed for business=%s', business.pk)
        return Response({'status': 'processed', 'subscription_id': subscription.pk, 'payment_id': payment.pk})
