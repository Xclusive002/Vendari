import hashlib
import hmac
import json
import urllib.error
import urllib.parse
import urllib.request
import logging
from datetime import timedelta
from decimal import Decimal

from django.conf import settings
from django.core.mail import EmailMultiAlternatives
from django.core import signing
from django.db import transaction
from django.utils import timezone
from rest_framework import status
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from businesses.models import Business, Membership
from invoices.models import Invoice, InvoicePayment

from .models import Plan, Subscription
from .serializers import PaystackInitializeSerializer
from .utils import has_feature

logger = logging.getLogger(__name__)


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


class PaystackBanksView(APIView):
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


class VerifyBankAccountView(APIView):
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


class CreateSubaccountView(APIView):
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


class InvoicePaymentInitializeView(APIView):
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


class PaystackInitializeView(APIView):
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
            'metadata': {'business_id': business.pk, 'plan_id': plan.pk},
        }
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

    def post(self, request):
        signature = request.headers.get('X-Paystack-Signature', '')
        expected = hmac.new(
            settings.PAYSTACK_SECRET_KEY.strip().encode(), request.body, hashlib.sha512,
        ).hexdigest()
        if not signature or not hmac.compare_digest(signature, expected):
            return Response({'error': 'Invalid signature.'}, status=status.HTTP_401_UNAUTHORIZED)
        try:
            payload = json.loads(request.body)
        except json.JSONDecodeError:
            return Response({'error': 'Invalid JSON payload.'}, status=status.HTTP_400_BAD_REQUEST)
        if payload.get('event') != 'charge.success':
            return Response({'status': 'ignored'})
        data = payload.get('data') or {}
        reference = data.get('reference')
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
        business_id = metadata.get('business_id')
        plan_id = metadata.get('plan_id')
        if not reference or not business_id or not plan_id:
            return Response({'error': 'Missing payment metadata.'}, status=status.HTTP_400_BAD_REQUEST)
        with transaction.atomic():
            if Subscription.objects.filter(paystack_reference=reference).exists():
                return Response({'status': 'already_processed'})
            business = Business.objects.filter(pk=business_id).first()
            plan = Plan.objects.filter(pk=plan_id).first()
            if business is None or plan is None:
                return Response({'error': 'Invalid payment metadata.'}, status=status.HTTP_400_BAD_REQUEST)
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
            business.plan = plan
            business.save(update_fields=('plan', 'updated_at'))
            try:
                send_subscription_success_email(business, plan)
            except Exception:
                logger.exception('Subscription confirmation email failed for business=%s', business.pk)
        return Response({'status': 'processed', 'subscription_id': subscription.pk})
