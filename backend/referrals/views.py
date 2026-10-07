import json
import logging
import urllib.parse
import uuid
from datetime import timedelta

from django.conf import settings
from django.core.cache import cache
from django.db import IntegrityError, transaction
from django.db.models import Q, Sum
from django.utils import timezone
import sentry_sdk
from rest_framework.pagination import PageNumberPagination
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.exceptions import Throttled
from rest_framework.status import HTTP_200_OK, HTTP_400_BAD_REQUEST, HTTP_409_CONFLICT, HTTP_423_LOCKED, HTTP_502_BAD_GATEWAY
from rest_framework.views import APIView

from vendari_api.rate_limits import rate_limited

from billing.views import paystack_request

from .fraud import refresh_referral_fraud_flags
from .models import Commission, Payout, PayoutAccount, PayoutAuditLog, Referral, ReferralCode, get_available_balance

logger = logging.getLogger(__name__)


class ReferralPageNumberPagination(PageNumberPagination):
    page_size = 20
    page_size_query_param = 'page_size'
    max_page_size = 100


class ReferralRateLimitedAPIView(APIView):
    permission_classes = [IsAuthenticated]
    rate_limit_scope = 'referrals'
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


def _log_payout_event(user, action, amount, reference, details=''):
    PayoutAuditLog.objects.create(
        user=user,
        action=action,
        amount=amount,
        reference=reference,
        details=details,
    )


def _mask_name(name):
    value = (name or '').strip()
    if not value:
        return 'Anonymous'
    if len(value) <= 3:
        return value[:1] + '***'
    return value[:3] + '***'


def _referral_status_label(referral):
    if referral.status == Referral.STATUS_REJECTED:
        return 'Rejected'
    if referral.status == Referral.STATUS_CONVERTED:
        return 'Paid'
    if referral.status == Referral.STATUS_SIGNED_UP and referral.created_at < timezone.now() - timedelta(days=settings.REFERRAL_SETTINGS.get('REFERRED_TRIAL_DAYS', 14)):
        return 'Expired'
    return 'Trial'


def _calc_tier_for_count(converted_count):
    tiers = settings.REFERRAL_SETTINGS.get('TIERS', [(1, 5, 20), (6, 20, 25), (21, None, 30)])
    current_rate = 0
    current_tier = None
    next_tier = None
    for min_count, max_count, percent in tiers:
        if converted_count >= min_count and (max_count is None or converted_count <= max_count):
            current_tier = {'min_count': min_count, 'max_count': max_count, 'rate_percent': int(percent)}
            current_rate = int(percent)
        if next_tier is None and converted_count < min_count:
            next_tier = {'min_count': min_count, 'rate_percent': int(percent)}
    if current_tier is None and next_tier is None:
        current_tier = {'min_count': tiers[-1][0], 'max_count': tiers[-1][1], 'rate_percent': int(tiers[-1][2])}
        current_rate = int(tiers[-1][2])
    if current_tier is None and converted_count == 0:
        next_tier = {'min_count': tiers[0][0], 'rate_percent': int(tiers[0][2])}
    return {
        'current_tier': current_tier,
        'current_rate': current_rate,
        'next_tier': next_tier,
        'next_tier_threshold': next_tier['min_count'] if next_tier else None,
    }


class ReferralValidateView(ReferralRateLimitedAPIView):
    permission_classes = [AllowAny]
    rate_limit_scope = 'referrals-validate'
    read_limit = 20

    def get(self, request, code):
        normalized_code = (code or '').strip().upper()
        referral_code = ReferralCode.objects.select_related('user').filter(code=normalized_code).first()
        if referral_code is None:
            return Response({'valid': False, 'referrer_first_name': ''})

        first_name = referral_code.user.full_name.strip().split()[0] if referral_code.user.full_name.strip() else 'Your friend'
        return Response({'valid': True, 'referrer_first_name': first_name})


class ReferralDashboardMeView(ReferralRateLimitedAPIView):
    def get(self, request):
        referral_code, _ = ReferralCode.objects.get_or_create(user=request.user)
        balance = get_available_balance(request.user)
        active_fraud_flags = refresh_referral_fraud_flags(request.user)
        trial_cutoff = timezone.now() - timedelta(
            days=settings.REFERRAL_SETTINGS.get('REFERRED_TRIAL_DAYS', 14)
        )
        converted_count = Referral.objects.filter(referrer=request.user, status=Referral.STATUS_CONVERTED).count()
        tier_info = _calc_tier_for_count(converted_count)
        counts = {
            'signups': Referral.objects.filter(referrer=request.user).count(),
            'trials': Referral.objects.filter(
                referrer=request.user,
                status=Referral.STATUS_SIGNED_UP,
                created_at__gte=trial_cutoff,
            ).count(),
            'paid_conversions': converted_count,
        }
        frontend_url = getattr(settings, 'FRONTEND_URL', settings.DASHBOARD_URL).rstrip('/')
        return Response({
            'referral_code': referral_code.code,
            'share_link': f'{frontend_url}/register?ref={referral_code.code}',
            'current_rate': tier_info['current_rate'],
            'current_tier': tier_info['current_tier'],
            'next_tier': tier_info['next_tier'],
            'next_tier_threshold': tier_info['next_tier_threshold'],
            'minimum_payout': int(settings.REFERRAL_SETTINGS.get('MIN_PAYOUT_KOBO', 500000)),
            'payout_held': bool(active_fraud_flags),
            'payout_lock_until': getattr(
                getattr(request.user, 'payout_account', None),
                'withdrawal_locked_until',
                None,
            ),
            'counts': counts,
            'balance': {
                'pending': int(balance.get('pending') or 0),
                'approved': int(balance.get('approved') or 0),
                'available': int(balance.get('available') or 0),
                'paid_total': int(balance.get('paid_total') or 0),
            },
        })


class ReferralListView(ReferralRateLimitedAPIView):
    pagination_class = ReferralPageNumberPagination

    def get(self, request):
        queryset = Referral.objects.filter(referrer=request.user).select_related(
            'referred_user',
            'code_used',
        ).annotate(
            commission_earned=Sum(
                'commissions__amount',
                filter=~Q(commissions__status=Commission.STATUS_REVERSED),
            )
        ).order_by('-created_at')
        paginator = self.pagination_class()
        page = paginator.paginate_queryset(queryset, request, view=self)
        results = []
        for referral in page or queryset:
            results.append({
                'id': referral.pk,
                'referred_name': _mask_name(referral.referred_user.full_name or referral.referred_user.email),
                'status': _referral_status_label(referral),
                'joined_date': referral.created_at.date().isoformat(),
                'commission_earned': int(referral.commission_earned or 0),
            })
        if page is not None:
            return paginator.get_paginated_response(results)
        return Response(results)


class ReferralCommissionListView(ReferralRateLimitedAPIView):
    pagination_class = ReferralPageNumberPagination

    def get(self, request):
        queryset = Commission.objects.filter(referrer=request.user).select_related('referral', 'referral__referred_user').order_by('-created_at')
        status_filter = request.query_params.get('status', '').strip().upper()
        if status_filter:
            queryset = queryset.filter(status=status_filter)
        paginator = self.pagination_class()
        page = paginator.paginate_queryset(queryset, request, view=self)
        results = []
        for commission in page or queryset:
            results.append({
                'id': commission.pk,
                'referral_id': commission.referral_id,
                'referred_name': _mask_name(commission.referral.referred_user.full_name or commission.referral.referred_user.email),
                'source': dict(Commission.SOURCE_CHOICES).get(commission.source, commission.source.title()),
                'status': dict(Commission.STATUS_CHOICES).get(commission.status, commission.status.title()),
                'amount': int(commission.amount),
                'gross_amount': int(commission.gross_amount),
                'rate_percent': int(commission.rate_percent),
                'created_at': commission.created_at.isoformat(),
                'payment_reference': commission.payment_reference,
            })
        if page is not None:
            return paginator.get_paginated_response(results)
        return Response(results)


class ReferralPayoutListView(ReferralRateLimitedAPIView):
    pagination_class = ReferralPageNumberPagination

    def get(self, request):
        queryset = Payout.objects.filter(user=request.user).order_by('-created_at')
        status_filter = request.query_params.get('status', '').strip().upper()
        if status_filter:
            queryset = queryset.filter(status=status_filter)
        paginator = self.pagination_class()
        page = paginator.paginate_queryset(queryset, request, view=self)
        results = []
        for payout in page or queryset:
            results.append({
                'id': payout.pk,
                'amount': int(payout.amount),
                'fee': int(payout.fee),
                'status': dict(Payout.STATUS_CHOICES).get(payout.status, payout.status.title()),
                'reference': payout.reference,
                'paystack_transfer_code': payout.paystack_transfer_code,
                'created_at': payout.created_at.isoformat(),
                'completed_at': payout.completed_at.isoformat() if payout.completed_at else None,
            })
        if page is not None:
            return paginator.get_paginated_response(results)
        return Response(results)


class ReferralBanksView(ReferralRateLimitedAPIView):
    rate_limit_scope = 'referral-banks'
    read_limit = 20
    def get(self, request):
        cache_key = 'paystack-banks:nigeria:24h'
        banks = cache.get(cache_key)
        if banks is None:
            data = paystack_request('bank?country=nigeria')
            banks = data.get('data', []) if data and data.get('status') else []
            cache.set(cache_key, banks, timeout=24 * 60 * 60)
        return Response(banks)


class ReferralPayoutAccountView(ReferralRateLimitedAPIView):
    rate_limit_scope = 'referral-payout-account'
    write_limit = 5

    def post(self, request):
        bank_code = str(request.data.get('bank_code', '')).strip()
        account_number = str(request.data.get('account_number', '')).strip()
        if not bank_code or not account_number:
            return Response({'detail': 'Bank code and account number are required.'}, status=HTTP_400_BAD_REQUEST)
        if not account_number.isdigit() or len(account_number) != 10:
            return Response({'detail': 'Enter a valid 10-digit bank account number.'}, status=HTTP_400_BAD_REQUEST)

        existing_account = PayoutAccount.objects.filter(user=request.user).first()
        is_change = existing_account is not None and (
            existing_account.bank_code != bank_code
            or existing_account.account_number != account_number
        )
        if is_change:
            password = str(request.data.get('password', ''))
            if not password or not request.user.check_password(password):
                return Response({'detail': 'Re-enter your password to change the payout account.'}, status=HTTP_400_BAD_REQUEST)

        resolve = paystack_request(f'bank/resolve?account_number={urllib.parse.quote(account_number)}&bank_code={urllib.parse.quote(bank_code)}')
        if not resolve or not resolve.get('status'):
            return Response({'detail': 'We could not verify that bank account.'}, status=HTTP_400_BAD_REQUEST)

        account_name = str(resolve.get('data', {}).get('account_name', '')).strip()
        if not account_name:
            return Response({'detail': 'We could not verify that bank account.'}, status=HTTP_400_BAD_REQUEST)

        recipient = paystack_request(
            'transferrecipient',
            {
                'type': 'nuban',
                'name': account_name,
                'account_number': account_number,
                'bank_code': bank_code,
                'currency': 'NGN',
            },
            method='POST',
        )
        if not recipient or not recipient.get('status'):
            return Response({'detail': 'Paystack could not create a transfer recipient.'}, status=HTTP_400_BAD_REQUEST)

        recipient_code = str(recipient.get('data', {}).get('recipient_code', '')).strip()
        with transaction.atomic():
            payout_account = PayoutAccount.objects.select_for_update().filter(user=request.user).first()
            changed = payout_account is not None and (
                payout_account.bank_code != bank_code
                or payout_account.account_number != account_number
            )
            if changed:
                password = str(request.data.get('password', ''))
                if not password or not request.user.check_password(password):
                    return Response({'detail': 'Re-enter your password to change the payout account.'}, status=HTTP_400_BAD_REQUEST)
                payout_account.bank_code = bank_code
                payout_account.account_number = account_number
                payout_account.account_name = account_name
                payout_account.bank_name = resolve.get('data', {}).get('bank_name', '')
                payout_account.paystack_recipient_code = recipient_code
                payout_account.verified_at = timezone.now()
                payout_account.withdrawal_locked_until = timezone.now() + timedelta(hours=24)
                payout_account.save()
                action = 'payout_account_changed'
            elif payout_account is None:
                payout_account = PayoutAccount.objects.create(
                    user=request.user,
                    bank_code=bank_code,
                    account_number=account_number,
                    account_name=account_name,
                    bank_name=resolve.get('data', {}).get('bank_name', ''),
                    paystack_recipient_code=recipient_code,
                    verified_at=timezone.now(),
                )
                action = 'payout_account_created'
            else:
                payout_account.account_name = account_name
                payout_account.bank_name = resolve.get('data', {}).get('bank_name', '')
                payout_account.paystack_recipient_code = recipient_code
                payout_account.verified_at = timezone.now()
                payout_account.save(update_fields=[
                    'account_name', 'bank_name', 'paystack_recipient_code', 'verified_at'
                ])
                action = 'payout_account_verified'
            _log_payout_event(request.user, action, 0, payout_account.paystack_recipient_code, f'bank_code={bank_code}')
        refresh_referral_fraud_flags(request.user)
        return Response({
            'account_name': payout_account.account_name,
            'bank_code': payout_account.bank_code,
            'account_number': payout_account.account_number,
            'recipient_code': payout_account.paystack_recipient_code,
        })


class ReferralWithdrawView(ReferralRateLimitedAPIView):
    rate_limit_scope = 'referral-withdraw'
    write_limit = 3

    def post(self, request):
        amount = request.data.get('amount')
        try:
            amount = int(amount)
        except (TypeError, ValueError):
            return Response({'detail': 'Amount must be a valid integer in kobo.'}, status=HTTP_400_BAD_REQUEST)

        if amount <= 0:
            return Response({'detail': 'Amount must be greater than zero.'}, status=HTTP_400_BAD_REQUEST)

        if amount < settings.REFERRAL_SETTINGS.get('MIN_PAYOUT_KOBO', 500000):
            return Response({'detail': 'Amount is below the minimum payout.'}, status=HTTP_400_BAD_REQUEST)

        daily_cap = settings.REFERRAL_SETTINGS.get('DAILY_WITHDRAWAL_CAP_KOBO', 5000000)
        if amount > daily_cap:
            return Response({'detail': 'Amount exceeds the daily withdrawal limit.'}, status=HTTP_400_BAD_REQUEST)

        idempotency_key = str(
            request.data.get('idempotency_key')
            or request.headers.get('X-Idempotency-Key')
            or request.headers.get('Idempotency-Key')
            or f'withdraw:{uuid.uuid4().hex}'
        ).strip()
        if len(idempotency_key) > 120:
            return Response({'detail': 'Idempotency key is too long.'}, status=HTTP_400_BAD_REQUEST)

        def replay_response(payout):
            if payout.user_id != request.user.pk or payout.amount != amount:
                return Response({'detail': 'Idempotency key was already used for a different request.'}, status=HTTP_409_CONFLICT)
            if payout.status == Payout.STATUS_FAILED:
                return Response({'detail': payout.failure_reason or 'Withdrawal failed.'}, status=HTTP_400_BAD_REQUEST)
            return Response({
                'status': payout.status.lower(),
                'amount': payout.amount,
                'reference': payout.reference,
                'transfer_code': payout.paystack_transfer_code,
                'idempotent_replay': True,
            })

        try:
            with transaction.atomic():
                request.user.__class__.objects.select_for_update().get(pk=request.user.pk)
                existing = Payout.objects.filter(idempotency_key=idempotency_key).first()
                if existing:
                    return replay_response(existing)

                active_flags = refresh_referral_fraud_flags(request.user)
                if active_flags:
                    return Response({
                        'detail': 'Withdrawals are paused while your referral account is reviewed.',
                        'review_required': True,
                    }, status=HTTP_423_LOCKED)

                payout_account = PayoutAccount.objects.select_for_update().filter(user=request.user).first()
                if not payout_account or not payout_account.paystack_recipient_code:
                    return Response({'detail': 'Save a valid payout account before withdrawing.'}, status=HTTP_400_BAD_REQUEST)
                now = timezone.now()
                if payout_account.withdrawal_locked_until and payout_account.withdrawal_locked_until > now:
                    return Response({
                        'detail': 'Withdrawals are locked for 24 hours after a payout account change.',
                        'withdrawal_locked_until': payout_account.withdrawal_locked_until,
                    }, status=HTTP_423_LOCKED)

                today = now.date()
                daily_total = Payout.objects.filter(
                    user=request.user,
                    created_at__date=today,
                ).aggregate(total=Sum('amount'))['total'] or 0
                if daily_total + amount > daily_cap:
                    return Response({'detail': 'This withdrawal would exceed the daily cap.'}, status=HTTP_400_BAD_REQUEST)

                if Payout.objects.filter(user=request.user, status=Payout.STATUS_PROCESSING).exists():
                    return Response({'detail': 'You already have an active payout in progress.'}, status=HTTP_409_CONFLICT)

                approved_commissions = list(
                    Commission.objects.filter(referrer=request.user, status=Commission.STATUS_APPROVED)
                    .select_for_update()
                    .order_by('pk')
                )
                approved_total = sum(commission.amount for commission in approved_commissions)
                processing_total = int(Payout.objects.filter(
                    user=request.user,
                    status=Payout.STATUS_PROCESSING,
                ).aggregate(total=Sum('amount'))['total'] or 0)
                available_balance = max(approved_total - processing_total, 0)
                if amount > available_balance:
                    return Response({'detail': 'Insufficient approved referral balance.'}, status=HTTP_400_BAD_REQUEST)

                reference = f'referral-withdraw-{uuid.uuid4().hex}'
                payout = Payout.objects.create(
                    user=request.user,
                    amount=amount,
                    fee=0,
                    status=Payout.STATUS_PROCESSING,
                    reference=reference,
                    idempotency_key=idempotency_key,
                )
                selected = []
                running_total = 0
                for commission in approved_commissions:
                    if running_total >= amount:
                        break
                    selected.append(commission)
                    running_total += commission.amount
                if selected:
                    payout.covered_commissions.set(selected)
        except IntegrityError:
            existing = Payout.objects.filter(idempotency_key=idempotency_key).first()
            if existing:
                return replay_response(existing)
            raise

        response = paystack_request(
            'transfer',
            {
                'source': 'balance',
                'reason': 'Referral commission payout',
                'amount': amount,
                'recipient': payout_account.paystack_recipient_code,
                'currency': 'NGN',
                'reference': payout.reference,
            },
            method='POST',
        )
        if not response:
            logger.error('Paystack transfer status is unknown for referral payout=%s', payout.reference)
            sentry_sdk.capture_message(
                'Paystack referral transfer status is unknown',
                level='error',
            )
            return Response({
                'detail': 'Withdrawal status is being confirmed. Do not submit another withdrawal.',
                'status': 'processing',
                'reference': payout.reference,
            }, status=HTTP_502_BAD_GATEWAY)

        with transaction.atomic():
            payout = Payout.objects.select_for_update().get(pk=payout.pk)
            if not response.get('status'):
                payout.status = Payout.STATUS_FAILED
                payout.failure_reason = str(response.get('message') or 'Paystack rejected the transfer')
                payout.completed_at = timezone.now()
                payout.save(update_fields=['status', 'failure_reason', 'completed_at'])
                _log_payout_event(request.user, 'withdraw_failed', amount, payout.reference, payout.failure_reason)
                return Response({'detail': 'Withdrawal failed. Please try again.'}, status=HTTP_400_BAD_REQUEST)

            payout.paystack_transfer_code = str(response.get('data', {}).get('transfer_code', ''))
            payout.save(update_fields=['paystack_transfer_code'])
            _log_payout_event(request.user, 'withdraw_initiated', amount, payout.reference, f'transfer_code={payout.paystack_transfer_code}')
            return Response({
                'status': payout.status.lower(),
                'amount': amount,
                'reference': payout.reference,
                'transfer_code': payout.paystack_transfer_code,
            })
