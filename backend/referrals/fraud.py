import re
import unicodedata
from datetime import timedelta

from django.conf import settings
from django.db import IntegrityError, transaction
from django.db.models import Count
from django.utils import timezone

from billing.models import UsageRecord
from customers.models import Customer
from expenses.models import Expense
from inventory.models import InventoryItem
from invoices.models import Invoice
from sales.models import Sale

from .models import Referral, ReferralFraudFlag


def _record_flag(referrer, code, details):
    if ReferralFraudFlag.objects.filter(
        referrer=referrer,
        code=code,
        resolved_at__isnull=True,
    ).exists():
        return
    try:
        with transaction.atomic():
            ReferralFraudFlag.objects.create(referrer=referrer, code=code, details=details)
    except IntegrityError:
        if not ReferralFraudFlag.objects.filter(
            referrer=referrer,
            code=code,
            resolved_at__isnull=True,
        ).exists():
            raise


def _normalized_name(value):
    decomposed = unicodedata.normalize('NFKD', value or '')
    return re.sub(r'[^a-z0-9]', '', decomposed.encode('ascii', 'ignore').decode().lower())


def refresh_referral_fraud_flags(referrer):
    referrals = Referral.objects.filter(referrer=referrer)
    threshold = settings.REFERRAL_SETTINGS.get('FRAUD_SHARED_SIGNUP_THRESHOLD', 3)
    recent = referrals.filter(created_at__gte=timezone.now() - timedelta(days=30))
    shared_ip_count = recent.exclude(signup_ip__isnull=True).values('signup_ip').annotate(
        account_count=Count('pk')
    ).order_by('-account_count').values_list('account_count', flat=True).first() or 0
    shared_device_count = recent.exclude(signup_device_hash='').values(
        'signup_device_hash'
    ).annotate(account_count=Count('pk')).order_by(
        '-account_count'
    ).values_list('account_count', flat=True).first() or 0
    if shared_ip_count >= threshold:
        _record_flag(referrer, 'shared_signup_ip', f'{shared_ip_count} referred signups shared an IP within 30 days.')
    if shared_device_count >= threshold:
        _record_flag(referrer, 'shared_signup_device', f'{shared_device_count} referred signups shared a device within 30 days.')

    trial_days = settings.REFERRAL_SETTINGS.get('REFERRED_TRIAL_DAYS', 14)
    mature_trials = referrals.filter(
        status=Referral.STATUS_SIGNED_UP,
        created_at__lte=timezone.now() - timedelta(days=trial_days),
    )
    mature_trial_users = list(mature_trials.values_list('referred_user_id', flat=True))
    verified_count = mature_trials.filter(referred_user__is_verified=False).count()
    active_users = set()
    if mature_trial_users:
        active_users.update(UsageRecord.objects.filter(
            business__owner_id__in=mature_trial_users,
            count__gt=0,
        ).values_list('business__owner_id', flat=True).distinct())
        for model in (Customer, Expense, InventoryItem, Invoice, Sale):
            active_users.update(
                model.objects.filter(
                    business__owner_id__in=mature_trial_users,
                ).values_list('business__owner_id', flat=True).distinct()
            )
    no_usage_users = set(mature_trial_users).difference(active_users)

    inactive_threshold = settings.REFERRAL_SETTINGS.get('FRAUD_INACTIVE_TRIAL_THRESHOLD', 3)
    if verified_count >= inactive_threshold:
        _record_flag(
            referrer,
            'unverified_trial_accounts',
            f'{verified_count} referred trial accounts remained unverified after {trial_days} days.',
        )
    if len(no_usage_users) >= inactive_threshold:
        _record_flag(
            referrer,
            'unused_trial_accounts',
            f'{len(no_usage_users)} referred trial accounts had no metered product usage after {trial_days} days.',
        )

    account = getattr(referrer, 'payout_account', None)
    account_name = _normalized_name(account.account_name) if account else ''
    if len(account_name) >= 4:
        matching_users = [
            referral.referred_user_id
            for referral in referrals.select_related('referred_user')
            if _normalized_name(referral.referred_user.full_name) == account_name
        ]
        if matching_users:
            _record_flag(
                referrer,
                'payout_name_matches_referred_user',
                f'The payout account name matches {len(matching_users)} referred account name(s).',
            )

    return list(referrer.referral_fraud_flags.filter(resolved_at__isnull=True))


def flag_quick_refund(referred_user, payment):
    referral = Referral.objects.filter(
        referred_user=referred_user,
        first_paid_at__isnull=False,
    ).select_related('referrer').first()
    if referral and payment.paid_at and (
        timezone.now() - payment.paid_at
    ) <= timedelta(days=settings.REFERRAL_SETTINGS.get('FRAUD_QUICK_REFUND_DAYS', 14)):
        _record_flag(
            referral.referrer,
            'quick_refund',
            f'A referred membership payment was refunded within {settings.REFERRAL_SETTINGS.get("FRAUD_QUICK_REFUND_DAYS", 14)} days.',
        )


def flag_quick_cancellation(referred_user):
    referral = Referral.objects.filter(
        referred_user=referred_user,
        first_paid_at__isnull=False,
    ).select_related('referrer').first()
    if referral and timezone.now() - referral.first_paid_at <= timedelta(
        days=settings.REFERRAL_SETTINGS.get('FRAUD_QUICK_CANCEL_DAYS', 7)
    ):
        _record_flag(
            referral.referrer,
            'quick_cancellation',
            f'A referred membership was cancelled within {settings.REFERRAL_SETTINGS.get("FRAUD_QUICK_CANCEL_DAYS", 7)} days of its first payment.',
        )
