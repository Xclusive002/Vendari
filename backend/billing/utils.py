def has_feature(business, flag_name):
    plan = getattr(business, 'plan', None)
    # If no plan is set, allow the feature by default (early access)
    if not plan:
        return True
    return bool(plan.feature_flags.get(flag_name, False))