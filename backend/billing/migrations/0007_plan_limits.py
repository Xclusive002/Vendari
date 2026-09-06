from django.db import migrations, models


FREE_LIMITS = {'invoices_per_month': 3, 'team_members': 0, 'ai_questions': 0, 'voice_entries': 0}
PRO_LIMITS = {'invoices_per_month': 100, 'team_members': 3, 'ai_questions': 100, 'voice_entries': 100}
GROWTH_LIMITS = {'invoices_per_month': 1000, 'team_members': 10, 'ai_questions': 500, 'voice_entries': 500}


def set_plan_limits(apps, schema_editor):
    Plan = apps.get_model('billing', 'Plan')
    limits = {'free': FREE_LIMITS, 'pro': PRO_LIMITS, 'enterprise': GROWTH_LIMITS}
    for plan in Plan.objects.all():
        plan.limits = limits.get(plan.name, FREE_LIMITS)
        plan.save(update_fields=['limits'])


class Migration(migrations.Migration):
    dependencies = [
        ('billing', '0006_usagerecord'),
    ]

    operations = [
        migrations.AddField(model_name='plan', name='limits', field=models.JSONField(default=dict)),
        migrations.RunPython(set_plan_limits, migrations.RunPython.noop),
    ]
