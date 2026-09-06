from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):
    dependencies = [
        ('billing', '0005_normalize_plan_entitlements'),
        ('businesses', '0005_business_paystack_fields'),
    ]

    operations = [
        migrations.CreateModel(
            name='UsageRecord',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('period', models.DateField()),
                ('metric', models.CharField(max_length=50)),
                ('count', models.PositiveIntegerField(default=0)),
                ('business', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='usage_records', to='businesses.business')),
            ],
            options={'constraints': [models.UniqueConstraint(fields=('business', 'period', 'metric'), name='unique_business_usage_period_metric')]},
        ),
    ]
