from django.db import migrations, models


DEFAULT_FLAGS = {'ai_insights': True, 'nl_reporting': True, 'forecasting': True}


def set_default_feature_flags(apps, schema_editor):
    Plan = apps.get_model('billing', 'Plan')
    Plan.objects.all().update(feature_flags=DEFAULT_FLAGS)


class Migration(migrations.Migration):
    dependencies = [('billing', '0002_initial')]
    operations = [
        migrations.AddField('plan', 'amount', models.DecimalField(decimal_places=2, default=0, max_digits=12)),
        migrations.AddField('plan', 'interval', models.CharField(choices=[('monthly', 'Monthly'), ('yearly', 'Yearly')], default='monthly', max_length=20)),
        migrations.AlterField('plan', 'feature_flags', models.JSONField(default=dict)),
        migrations.RunPython(set_default_feature_flags, migrations.RunPython.noop),
    ]