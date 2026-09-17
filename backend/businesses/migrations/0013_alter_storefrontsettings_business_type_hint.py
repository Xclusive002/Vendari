from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ('businesses', '0012_storefrontsettings_about'),
    ]

    operations = [
        migrations.AlterField(
            model_name='storefrontsettings',
            name='business_type_hint',
            field=models.CharField(
                blank=True,
                choices=[('products', 'Products'), ('services', 'Services'), ('both', 'Both')],
                default='',
                max_length=20,
            ),
        ),
    ]
