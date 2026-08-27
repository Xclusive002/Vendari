from decimal import Decimal

from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [('businesses', '0004_conciergeinquiry')]

    operations = [
        migrations.AddField(model_name='business', name='bank_code', field=models.CharField(blank=True, max_length=20)),
        migrations.AddField(model_name='business', name='bank_account_number', field=models.CharField(blank=True, max_length=20)),
        migrations.AddField(model_name='business', name='bank_account_name', field=models.CharField(blank=True, max_length=255)),
        migrations.AddField(model_name='business', name='paystack_subaccount_code', field=models.CharField(blank=True, max_length=100)),
        migrations.AddField(model_name='business', name='platform_fee_percentage', field=models.DecimalField(decimal_places=2, default=Decimal('0.00'), max_digits=5)),
    ]