def has_feature(business, flag_name):
    plan = getattr(business, 'plan', None)
    return bool(plan and plan.feature_flags.get(flag_name, False))