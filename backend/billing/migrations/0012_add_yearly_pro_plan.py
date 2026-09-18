from django.db import migrations, models


PRO_FEATURE_FLAGS = {
    'ai_insights': True,
    'nl_reporting': True,
    'forecasting': True,
    'voice_entry': True,
    'invoice_ai': True,
    'advanced_reports': True,
    'payments': True,
    'team_members': True,
}

PRO_LIMITS = {
    'invoices_per_month': 100,
    'team_members': 3,
    'ai_questions': 100,
    'voice_entries': 100,
}


def create_yearly_plan(apps, schema_editor):
    Plan = apps.get_model('billing', 'Plan')
    Plan.objects.update_or_create(
        name='pro',
        interval='yearly',
        defaults={
            'amount': 49999,
            'paystack_plan_code': '',
            'feature_flags': PRO_FEATURE_FLAGS,
            'limits': PRO_LIMITS,
        },
    )


def remove_yearly_plan(apps, schema_editor):
    Plan = apps.get_model('billing', 'Plan')
    Plan.objects.filter(name='pro', interval='yearly').delete()


class Migration(migrations.Migration):
    dependencies = [
        ('billing', '0011_enable_ai_insights'),
    ]

    operations = [
        migrations.AddField(
            model_name='plan',
            name='paystack_plan_code',
            field=models.CharField(blank=True, default='', max_length=100),
        ),
        migrations.RunPython(create_yearly_plan, remove_yearly_plan),
    ]
