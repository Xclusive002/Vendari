from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ('billing', '0007_plan_limits'),
    ]

    operations = [
        migrations.AlterField(
            model_name='plan',
            name='name',
            field=models.CharField(choices=[('pro', 'Pro'), ('enterprise', 'Enterprise')], max_length=20),
        ),
    ]