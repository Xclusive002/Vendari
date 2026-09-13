from django.utils import timezone
from django.db import transaction
from datetime import date

from .models import UsageRecord

USAGE_LIMITS = {
    'ai_questions': {'pro': 100, 'enterprise': 500},
    'voice_entries': {'pro': 100, 'enterprise': 500},
    'invoice_ai': {'pro': 50, 'enterprise': 250},
    'report_exports': {'pro': 30, 'enterprise': 150},
}


def has_feature(business, flag_name):
    plan = getattr(business, 'plan', None)
    if not plan:
        return False
    if business.trial_active:
        return bool(plan.feature_flags.get(flag_name, False))
    subscription = getattr(business, 'subscription', None)
    if not subscription or subscription.status != subscription.STATUS_ACTIVE:
        return False
    if subscription.renews_at and subscription.renews_at <= timezone.now():
        return False
    return bool(plan.feature_flags.get(flag_name, False))


@transaction.atomic
def consume_usage(business, metric, amount=1):
    plan_name = business.plan.name if business.plan else 'pro'
    limit = USAGE_LIMITS.get(metric, {}).get(plan_name, 0)
    period = timezone.localdate().replace(day=1)
    record, _ = UsageRecord.objects.select_for_update().get_or_create(
        business=business, period=period, metric=metric,
    )
    if record.count + amount > limit:
        return False, record.count, limit
    record.count += amount
    record.save(update_fields=['count'])
    return True, record.count, limit