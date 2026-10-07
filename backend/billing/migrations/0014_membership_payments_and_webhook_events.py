from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('billing', '0013_update_pro_plan_amounts'),
        ('businesses', '0014_storefrontsettings_product_display_mode'),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.CreateModel(
            name='Payment',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('provider', models.CharField(default='paystack', max_length=30)),
                ('reference', models.CharField(db_index=True, max_length=255, unique=True)),
                ('amount', models.DecimalField(decimal_places=2, default=0, max_digits=12)),
                ('fee', models.DecimalField(decimal_places=2, default=0, max_digits=12)),
                ('currency', models.CharField(default='NGN', max_length=8)),
                ('interval', models.CharField(choices=[('monthly', 'Monthly'), ('yearly', 'Yearly')], default='monthly', max_length=20)),
                ('status', models.CharField(default='pending', max_length=30)),
                ('paid_at', models.DateTimeField(blank=True, null=True)),
                ('metadata', models.JSONField(blank=True, default=dict)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('business', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='membership_payments', to='businesses.business')),
                ('user', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='membership_payments', to=settings.AUTH_USER_MODEL)),
            ],
            options={
                'ordering': ('-paid_at', '-created_at'),
            },
        ),
        migrations.CreateModel(
            name='WebhookEvent',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('event', models.CharField(max_length=100)),
                ('event_id', models.CharField(blank=True, db_index=True, max_length=255)),
                ('reference', models.CharField(blank=True, db_index=True, max_length=255)),
                ('payload', models.JSONField(default=dict)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('processed_at', models.DateTimeField(blank=True, null=True)),
            ],
            options={
                'constraints': [
                    models.UniqueConstraint(condition=models.Q(event_id__gt=''), fields=('event_id',), name='unique_webhook_event_id'),
                    models.UniqueConstraint(condition=models.Q(reference__gt=''), fields=('reference',), name='unique_webhook_event_reference'),
                ],
            },
        ),
    ]
