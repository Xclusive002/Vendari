from django.db import migrations


FREE_FLAGS = {
    'ai_insights': False,
    'nl_reporting': False,
    'forecasting': False,
    'voice_entry': False,
    'invoice_ai': False,
    'advanced_reports': False,
    'payments': False,
    'team_members': False,
}

PRO_FLAGS = {
    **FREE_FLAGS,
    'ai_insights': True,
    'nl_reporting': True,
    'forecasting': True,
    'voice_entry': True,
    'invoice_ai': True,
    'advanced_reports': True,
    'payments': True,
    'team_members': True,
}


def normalize_entitlements(apps, schema_editor):
    Plan = apps.get_model('billing', 'Plan')
    Business = apps.get_model('businesses', 'Business')
    plans = {
        'free': (0, FREE_FLAGS),
        'pro': (9500, PRO_FLAGS),
        'enterprise': (25000, {key: True for key in FREE_FLAGS}),
    }

    for name, (amount, flags) in plans.items():
        Plan.objects.update_or_create(
            name=name,
            interval='monthly',
            defaults={'amount': amount, 'feature_flags': flags},
        )

    free_plan = Plan.objects.filter(name='free', interval='monthly').first()

    for plan in Plan.objects.all():
        if plan.name == 'free':
            plan.feature_flags = FREE_FLAGS
        elif plan.name == 'pro':
            plan.feature_flags = PRO_FLAGS
        else:
            plan.feature_flags = {key: True for key in FREE_FLAGS}
        plan.save(update_fields=['feature_flags'])

    if free_plan:
        Business.objects.filter(plan__isnull=True).update(plan=free_plan)


def reverse_noop(apps, schema_editor):
    pass


class Migration(migrations.Migration):
    dependencies = [
        ('billing', '0004_alter_plan_feature_flags'),
        ('businesses', '0001_initial'),
    ]

    operations = [
        migrations.RunPython(normalize_entitlements, reverse_noop),
    ]
