from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ('billing', '0009_single_pro_plan'),
    ]

    operations = [
        migrations.AlterField(
            model_name='plan',
            name='name',
            field=models.CharField(choices=[('pro', 'Pro')], max_length=20),
        ),
    ]