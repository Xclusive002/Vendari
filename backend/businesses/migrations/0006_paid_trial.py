from datetime import timedelta

from django.db import migrations, models
from django.utils import timezone


def move_businesses_to_paid_trial(apps, schema_editor):
    Business = apps.get_model('businesses', 'Business')
    Plan = apps.get_model('billing', 'Plan')
    paid_plan = Plan.objects.filter(name='pro', interval='monthly').first()
    if paid_plan is None:
        paid_plan = Plan.objects.create(name='pro', interval='monthly', amount=4999)
    trial_started_at = timezone.now()
    Business.objects.filter(plan__name='free').update(
        plan=paid_plan,
        trial_started_at=trial_started_at,
        trial_ends_at=trial_started_at + timedelta(days=5),
    )
    Business.objects.filter(plan__isnull=True).update(
        plan=paid_plan,
        trial_started_at=trial_started_at,
        trial_ends_at=trial_started_at + timedelta(days=5),
    )
    Plan.objects.filter(name='pro', interval='monthly').update(amount=4999)
    Plan.objects.filter(name='free').delete()


class Migration(migrations.Migration):
    dependencies = [
        ('businesses', '0006_invite_lifecycle'),
        ('billing', '0005_normalize_plan_entitlements'),
    ]

    operations = [
        migrations.AddField(
            model_name='business',
            name='trial_started_at',
            field=models.DateTimeField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name='business',
            name='trial_ends_at',
            field=models.DateTimeField(blank=True, null=True),
        ),
        migrations.RunPython(move_businesses_to_paid_trial, migrations.RunPython.noop),
    ]