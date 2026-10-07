import math
import secrets
from decimal import Decimal

from django.conf import settings
from django.core.exceptions import ValidationError
from django.db import models
from django.db.models import Case, Sum, Value, When
from django.utils import timezone


def _tier_percent_for_count(converted_count):
    for min_count, max_count, percent in settings.REFERRAL_SETTINGS.get('TIERS', [(1, 5, 20), (6, 20, 25), (21, None, 30)]):
        if converted_count >= min_count and (max_count is None or converted_count <= max_count):
            return int(percent)
    return 0


def get_balance(user):
    aggregates = Commission.objects.filter(referrer=user).aggregate(
        pending=Sum(Case(When(status=Commission.STATUS_PENDING, then='amount'), default=Value(0), output_field=models.BigIntegerField())),
        approved=Sum(Case(When(status=Commission.STATUS_APPROVED, then='amount'), default=Value(0), output_field=models.BigIntegerField())),
        paid_total=Sum(Case(When(status=Commission.STATUS_PAID, then='amount'), default=Value(0), output_field=models.BigIntegerField())),
        lifetime_earned=Sum('amount'),
    )
    return {
        'pending': int(aggregates.get('pending') or 0),
        'approved': int(aggregates.get('approved') or 0),
        'paid_total': int(aggregates.get('paid_total') or 0),
        'lifetime_earned': int(aggregates.get('lifetime_earned') or 0),
    }


def get_available_balance(user):
    base = get_balance(user)
    processing_total = Payout.objects.filter(user=user, status=Payout.STATUS_PROCESSING).aggregate(
        total=Sum('amount')
    )['total'] or 0
    return {
        **base,
        'processing': int(processing_total),
        'available': max(int(base['approved']) - int(processing_total), 0),
    }


def _is_within_commission_window(first_paid_at, payment_paid_at):
    if not first_paid_at or not payment_paid_at:
        return False
    if payment_paid_at < first_paid_at:
        return False
    months_difference = (payment_paid_at.year - first_paid_at.year) * 12 + (payment_paid_at.month - first_paid_at.month)
    return months_difference <= settings.REFERRAL_SETTINGS.get('COMMISSION_WINDOW_MONTHS', 12)


def _referrer_converted_count(referrer):
    return Referral.objects.filter(referrer=referrer, status=Referral.STATUS_CONVERTED).count()


def _commission_limit_for_interval(interval):
    return 12 if interval == 'monthly' else 1


# placeholder for later model definitions

REFERRAL_CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'


def generate_referral_code(length=8):
    return ''.join(secrets.choice(REFERRAL_CODE_ALPHABET) for _ in range(length))


class ReferralCode(models.Model):
    user = models.OneToOneField(settings.AUTH_USER_MODEL, related_name='referral_code', on_delete=models.CASCADE)
    code = models.CharField(max_length=8, unique=True, db_index=True, default='')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ('-created_at',)

    def clean(self):
        super().clean()
        if self.code and any(ch not in REFERRAL_CODE_ALPHABET for ch in self.code):
            raise ValidationError({'code': 'Referral code can only contain uppercase letters and numbers excluding ambiguous characters.'})
        if len(self.code) and len(self.code) != 8:
            raise ValidationError({'code': 'Referral code must be exactly 8 characters long.'})

    def save(self, *args, **kwargs):
        if not self.code:
            while True:
                candidate = generate_referral_code()
                if not ReferralCode.objects.filter(code=candidate).exists():
                    self.code = candidate
                    break
        self.full_clean()
        super().save(*args, **kwargs)

    def __str__(self):
        return f'{self.user.email} - {self.code}'


class Referral(models.Model):
    STATUS_SIGNED_UP = 'SIGNED_UP'
    STATUS_CONVERTED = 'CONVERTED'
    STATUS_REJECTED = 'REJECTED'
    STATUS_CHOICES = [
        (STATUS_SIGNED_UP, 'Signed up'),
        (STATUS_CONVERTED, 'Converted'),
        (STATUS_REJECTED, 'Rejected'),
    ]

    referrer = models.ForeignKey(settings.AUTH_USER_MODEL, related_name='referrals_sent', on_delete=models.CASCADE)
    referred_user = models.OneToOneField(settings.AUTH_USER_MODEL, related_name='referral_record', on_delete=models.CASCADE)
    code_used = models.ForeignKey('ReferralCode', related_name='referral_usage', on_delete=models.PROTECT)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default=STATUS_SIGNED_UP)
    created_at = models.DateTimeField(auto_now_add=True)
    converted_at = models.DateTimeField(null=True, blank=True)
    first_paid_at = models.DateTimeField(null=True, blank=True)
    bonus_granted_at = models.DateTimeField(null=True, blank=True)
    rejection_reason = models.TextField(blank=True, default='')
    signup_ip = models.GenericIPAddressField(null=True, blank=True)
    signup_device_hash = models.CharField(max_length=128, blank=True, default='')

    class Meta:
        ordering = ('-created_at',)
        constraints = [
            models.CheckConstraint(check=~models.Q(referrer_id=models.F('referred_user_id')), name='referral_referrer_must_differ_from_referred_user'),
        ]

    def __str__(self):
        return f'{self.referrer.email} -> {self.referred_user.email}'


class ReferralFraudFlag(models.Model):
    referrer = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        related_name='referral_fraud_flags',
        on_delete=models.CASCADE,
    )
    code = models.CharField(max_length=64)
    details = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)
    resolved_at = models.DateTimeField(null=True, blank=True)
    resolved_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        related_name='resolved_referral_fraud_flags',
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
    )

    class Meta:
        ordering = ('-created_at',)
        constraints = [
            models.UniqueConstraint(
                fields=('referrer', 'code'),
                condition=models.Q(resolved_at__isnull=True),
                name='unique_active_referral_fraud_flag',
            ),
        ]

    def __str__(self):
        return f'{self.referrer.email}: {self.code}'


class Commission(models.Model):
    STATUS_PENDING = 'PENDING'
    STATUS_APPROVED = 'APPROVED'
    STATUS_PAID = 'PAID'
    STATUS_REVERSED = 'REVERSED'
    STATUS_CHOICES = [
        (STATUS_PENDING, 'Pending'),
        (STATUS_APPROVED, 'Approved'),
        (STATUS_PAID, 'Paid'),
        (STATUS_REVERSED, 'Reversed'),
    ]

    SOURCE_MEMBERSHIP = 'MEMBERSHIP'
    SOURCE_CONCIERGE = 'CONCIERGE'
    SOURCE_CHOICES = [
        (SOURCE_MEMBERSHIP, 'Membership'),
        (SOURCE_CONCIERGE, 'Concierge'),
    ]

    referral = models.ForeignKey('Referral', related_name='commissions', on_delete=models.CASCADE)
    referrer = models.ForeignKey(settings.AUTH_USER_MODEL, related_name='referral_commissions', on_delete=models.CASCADE)
    source = models.CharField(max_length=20, choices=SOURCE_CHOICES, default=SOURCE_MEMBERSHIP)
    payment_reference = models.CharField(max_length=100, unique=True, blank=True, default='')
    gross_amount = models.BigIntegerField(default=0)
    paystack_fee = models.BigIntegerField(default=0)
    net_amount = models.BigIntegerField(default=0)
    rate_percent = models.PositiveSmallIntegerField(default=0)
    amount = models.BigIntegerField(default=0)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default=STATUS_PENDING)
    approve_after = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    reversed_reason = models.TextField(blank=True, default='')

    class Meta:
        ordering = ('-created_at',)

    def __str__(self):
        return f'{self.referrer.email} commission {self.amount}'


class PayoutAccount(models.Model):
    user = models.OneToOneField(settings.AUTH_USER_MODEL, related_name='payout_account', on_delete=models.CASCADE)
    bank_code = models.CharField(max_length=20, blank=True, default='')
    bank_name = models.CharField(max_length=255, blank=True, default='')
    account_number = models.CharField(max_length=20, blank=True, default='')
    account_name = models.CharField(max_length=255, blank=True, default='')
    paystack_recipient_code = models.CharField(max_length=120, blank=True, default='')
    verified_at = models.DateTimeField(null=True, blank=True)
    withdrawal_locked_until = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ('user__email',)

    def __str__(self):
        return f'{self.user.email} payout account'


class Payout(models.Model):
    STATUS_PROCESSING = 'PROCESSING'
    STATUS_SUCCESS = 'SUCCESS'
    STATUS_FAILED = 'FAILED'
    STATUS_REVERSED = 'REVERSED'
    STATUS_CHOICES = [
        (STATUS_PROCESSING, 'Processing'),
        (STATUS_SUCCESS, 'Success'),
        (STATUS_FAILED, 'Failed'),
        (STATUS_REVERSED, 'Reversed'),
    ]

    user = models.ForeignKey(settings.AUTH_USER_MODEL, related_name='payouts', on_delete=models.CASCADE)
    amount = models.BigIntegerField(default=0)
    fee = models.BigIntegerField(default=0)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default=STATUS_PROCESSING)
    paystack_transfer_code = models.CharField(max_length=120, blank=True, default='')
    reference = models.CharField(max_length=100, unique=True, blank=True, default='')
    idempotency_key = models.CharField(max_length=120, unique=True, blank=True, default='')
    covered_commissions = models.ManyToManyField('Commission', related_name='payouts', blank=True)
    failure_reason = models.TextField(blank=True, default='')
    created_at = models.DateTimeField(auto_now_add=True)
    completed_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ('-created_at',)

    def __str__(self):
        return f'{self.user.email} payout {self.reference or self.pk}'


class PayoutAuditLog(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, related_name='payout_audit_logs', on_delete=models.CASCADE)
    action = models.CharField(max_length=120)
    amount = models.BigIntegerField(default=0)
    reference = models.CharField(max_length=120, blank=True, default='')
    details = models.TextField(blank=True, default='')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ('-created_at',)

    def __str__(self):
        return f'{self.user.email} {self.action} {self.reference}'
