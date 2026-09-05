from django.db import models


def default_feature_flags():
    return {
        'ai_insights': False,
        'nl_reporting': False,
        'forecasting': False,
        'voice_entry': False,
        'invoice_ai': False,
        'advanced_reports': False,
        'payments': False,
        'team_members': False,
    }


class Plan(models.Model):
    PLAN_FREE = 'free'
    PLAN_PRO = 'pro'
    PLAN_ENTERPRISE = 'enterprise'
    PLAN_CHOICES = [
        (PLAN_FREE, 'Free'),
        (PLAN_PRO, 'Pro'),
        (PLAN_ENTERPRISE, 'Enterprise'),
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
    feature_flags = models.JSONField(default=default_feature_flags)

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
