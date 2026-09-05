from django.utils import timezone


def has_feature(business, flag_name):
    plan = getattr(business, 'plan', None)
    if not plan:
        return False
    subscription = getattr(business, 'subscription', None)
    if plan.name != plan.PLAN_FREE:
        if not subscription or subscription.status != subscription.STATUS_ACTIVE:
            return False
        if subscription.renews_at and subscription.renews_at <= timezone.now():
            return False
    return bool(plan.feature_flags.get(flag_name, False))