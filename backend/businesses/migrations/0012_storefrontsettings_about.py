from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ('businesses', '0011_storefrontsettings_business_type_hint_and_more'),
    ]

    operations = [
        migrations.AddField(
            model_name='storefrontsettings',
            name='about',
            field=models.TextField(blank=True),
        ),
    ]