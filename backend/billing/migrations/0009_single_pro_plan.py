from datetime import timedelta

from django.db import migrations
from django.db.models import Q
from django.utils import timezone


def keep_only_pro(apps, schema_editor):
    Plan = apps.get_model('billing', 'Plan')
    Business = apps.get_model('businesses', 'Business')
    pro_plan = Plan.objects.filter(name='pro', interval='monthly').first()
    if pro_plan is None:
        pro_plan = Plan.objects.create(
            name='pro', interval='monthly', amount=4999,
            feature_flags={
                'ai_insights': True,
                'nl_reporting': True,
                'forecasting': True,
                'voice_entry': True,
                'invoice_ai': True,
                'advanced_reports': True,
                'payments': True,
                'team_members': True,
            },
            limits={'invoices_per_month': 100, 'team_members': 3, 'ai_questions': 100, 'voice_entries': 100},
        )
    Subscription = apps.get_model('billing', 'Subscription')
    Subscription.objects.exclude(plan=pro_plan).update(plan=pro_plan)
    trial_started_at = timezone.now()
    Business.objects.filter(plan__isnull=False).exclude(plan=pro_plan).update(plan=pro_plan)
    Business.objects.filter(trial_ends_at__isnull=True).filter(Q(subscription__isnull=True) | ~Q(subscription__status='active')).update(
        trial_started_at=trial_started_at,
        trial_ends_at=trial_started_at + timedelta(days=5),
    )
    Plan.objects.exclude(pk=pro_plan.pk).delete()
    pro_plan.amount = 4999
    pro_plan.save(update_fields=('amount',))


class Migration(migrations.Migration):
    dependencies = [
        ('billing', '0008_alter_plan_name'),
        ('businesses', '0006_paid_trial'),
    ]

    operations = [migrations.RunPython(keep_only_pro, migrations.RunPython.noop)]