from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ('businesses', '0005_business_paystack_fields'),
    ]

    operations = [
        migrations.AddField(model_name='invitecode', name='email', field=models.EmailField(blank=True, max_length=254)),
        migrations.AddField(model_name='invitecode', name='expires_at', field=models.DateTimeField(blank=True, null=True)),
        migrations.AddField(model_name='invitecode', name='revoked_at', field=models.DateTimeField(blank=True, null=True)),
    ]
