from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ('businesses', '0013_alter_storefrontsettings_business_type_hint'),
    ]

    operations = [
        migrations.AddField(
            model_name='storefrontsettings',
            name='product_display_mode',
            field=models.CharField(
                choices=[('flexed', 'Flexed grid'), ('block', 'Block list')],
                default='flexed',
                max_length=20,
            ),
        ),
    ]