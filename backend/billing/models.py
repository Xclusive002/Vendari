from decimal import Decimal

from django.conf import settings
from django.db import models
from django.dispatch import Signal


membership_payment_succeeded = Signal()
membership_payment_refunded = Signal()


def default_feature_flags():
    return {
        'ai_insights': True,
        'nl_reporting': False,
        'forecasting': False,
        'voice_entry': False,
        'invoice_ai': False,
        'advanced_reports': False,
        'payments': False,
        'team_members': False,
    }


class Plan(models.Model):
    PLAN_PRO = 'pro'
    PLAN_CHOICES = [
        (PLAN_PRO, 'Pro'),
    ]
    INTERVAL_MONTHLY = 'monthly'
    INTERVAL_YEARLY = 'yearly'
    INTERVAL_CHOICES = [
        (INTERVAL_MONTHLY, 'Monthly'),
        (INTERVAL_YEARLY, 'Yearly'),
    ]

    name = models.CharField(max_length=20, choices=PLAN_CHOICES)
    amount = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    interval = models.CharField(max_length=20, choices=INTERVAL_CHOICES, default=INTERVAL_MONTHLY)
    paystack_plan_code = models.CharField(max_length=100, blank=True, default='')
    feature_flags = models.JSONField(default=default_feature_flags)
    limits = models.JSONField(default=dict)

    @classmethod
    def get_membership_plan(cls, interval):
        interval = (interval or '').lower()
        if interval not in {cls.INTERVAL_MONTHLY, cls.INTERVAL_YEARLY}:
            raise ValueError('Unsupported membership interval.')
        amount_kobo = getattr(settings, 'PRO_MONTHLY_KOBO', 499900) if interval == cls.INTERVAL_MONTHLY else getattr(settings, 'PRO_YEARLY_KOBO', 4999000)
        plan_code = getattr(settings, 'PAYSTACK_MONTHLY_PLAN_CODE', '') if interval == cls.INTERVAL_MONTHLY else getattr(settings, 'PAYSTACK_YEARLY_PLAN_CODE', '')
        amount = Decimal(amount_kobo) / Decimal('100')
        plan, _ = cls.objects.get_or_create(
            name=cls.PLAN_PRO,
            interval=interval,
            defaults={
                'amount': amount,
                'paystack_plan_code': plan_code,
                'feature_flags': default_feature_flags(),
                'limits': {},
            },
        )
        updated = False
        if plan.amount != amount:
            plan.amount = amount
            updated = True
        if plan.paystack_plan_code != plan_code:
            plan.paystack_plan_code = plan_code
            updated = True
        if updated:
            plan.save(update_fields=['amount', 'paystack_plan_code'])
        return plan

    def __str__(self):
        return self.name


class Subscription(models.Model):
    STATUS_ACTIVE = 'active'
    STATUS_PAST_DUE = 'past_due'
    STATUS_CANCELLED = 'cancelled'
    STATUS_CHOICES = [
        (STATUS_ACTIVE, 'Active'),
        (STATUS_PAST_DUE, 'Past Due'),
        (STATUS_CANCELLED, 'Cancelled'),
    ]

    business = models.OneToOneField('businesses.Business', on_delete=models.CASCADE, related_name='subscription')
    plan = models.ForeignKey('billing.Plan', on_delete=models.CASCADE, related_name='subscriptions')
    paystack_reference = models.CharField(max_length=255, blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES)
    renews_at = models.DateTimeField(null=True, blank=True)

    def __str__(self):
        return f'{self.business.name} - {self.plan.name}'


class UsageRecord(models.Model):
    business = models.ForeignKey('businesses.Business', on_delete=models.CASCADE, related_name='usage_records')
    period = models.DateField()
    metric = models.CharField(max_length=50)
    count = models.PositiveIntegerField(default=0)

    class Meta:
        constraints = [models.UniqueConstraint(fields=('business', 'period', 'metric'), name='unique_business_usage_period_metric')]


class Payment(models.Model):
    provider = models.CharField(max_length=30, default='paystack')
    user = models.ForeignKey(settings.AUTH_USER_MODEL, null=True, blank=True, on_delete=models.SET_NULL, related_name='membership_payments')
    business = models.ForeignKey('businesses.Business', null=True, blank=True, on_delete=models.SET_NULL, related_name='membership_payments')
    reference = models.CharField(max_length=255, unique=True, db_index=True)
    amount = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    fee = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    currency = models.CharField(max_length=8, default='NGN')
    interval = models.CharField(max_length=20, choices=Plan.INTERVAL_CHOICES, default=Plan.INTERVAL_MONTHLY)
    status = models.CharField(max_length=30, default='pending')
    paid_at = models.DateTimeField(null=True, blank=True)
    metadata = models.JSONField(default=dict, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ('-paid_at', '-created_at')

    def __str__(self):
        return f'{self.reference} ({self.status})'


class WebhookEvent(models.Model):
    event = models.CharField(max_length=100)
    event_id = models.CharField(max_length=255, blank=True, db_index=True)
    reference = models.CharField(max_length=255, blank=True, db_index=True)
    payload = models.JSONField(default=dict)
    created_at = models.DateTimeField(auto_now_add=True)
    processing_started_at = models.DateTimeField(null=True, blank=True)
    processed_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(fields=['event_id'], name='unique_webhook_event_id', condition=models.Q(event_id__gt='')),
        ]

    def __str__(self):
        return f'{self.event}::{self.reference or self.event_id}'
