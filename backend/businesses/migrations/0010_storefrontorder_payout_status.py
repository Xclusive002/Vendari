from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ('businesses', '0009_storefrontorder_storefrontorderlineitem'),
    ]

    operations = [
        migrations.AddField(
            model_name='storefrontorder',
            name='payout_status',
            field=models.CharField(choices=[('pending', 'Pending'), ('settled', 'Settled'), ('failed', 'Failed')], default='pending', max_length=20),
        ),
        migrations.AddField(
            model_name='storefrontorder',
            name='settled_at',
            field=models.DateTimeField(blank=True, null=True),
        ),
    ]
