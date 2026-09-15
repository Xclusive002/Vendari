from django.db import migrations


def enable_ai_insights(apps, schema_editor):
    Plan = apps.get_model('billing', 'Plan')
    for plan in Plan.objects.all():
        flags = dict(plan.feature_flags or {})
        if not flags.get('ai_insights'):
            flags['ai_insights'] = True
            plan.feature_flags = flags
            plan.save(update_fields=('feature_flags',))


def disable_ai_insights(apps, schema_editor):
    Plan = apps.get_model('billing', 'Plan')
    for plan in Plan.objects.all():
        flags = dict(plan.feature_flags or {})
        flags['ai_insights'] = False
        plan.feature_flags = flags
        plan.save(update_fields=('feature_flags',))


class Migration(migrations.Migration):
    dependencies = [
        ('billing', '0010_single_pro_choice'),
    ]

    operations = [migrations.RunPython(enable_ai_insights, disable_ai_insights)]