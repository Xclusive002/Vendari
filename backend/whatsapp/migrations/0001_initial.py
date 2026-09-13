from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):
    initial = True

    dependencies = [
        ('businesses', '0007_business_whatsapp_number'),
    ]

    operations = [
        migrations.CreateModel(
            name='WhatsAppPendingAction',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('phone_number', models.CharField(max_length=30)),
                ('action_type', models.CharField(choices=[('sale', 'Sale'), ('inventory', 'Inventory'), ('customer', 'Customer')], max_length=20)),
                ('payload', models.JSONField(default=dict)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('business', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='whatsapp_pending_actions', to='businesses.business')),
            ],
            options={
                'ordering': ('-created_at',),
                'constraints': [models.UniqueConstraint(fields=('business', 'phone_number'), name='unique_whatsapp_pending_business_phone')],
            },
        ),
    ]
