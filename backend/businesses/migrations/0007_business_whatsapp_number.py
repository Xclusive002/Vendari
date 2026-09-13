from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ('businesses', '0006_paid_trial'),
    ]

    operations = [
        migrations.AddField(
            model_name='business',
            name='whatsapp_number',
            field=models.CharField(blank=True, max_length=30, null=True, unique=True),
        ),
    ]