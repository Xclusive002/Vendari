from decimal import Decimal

from django.db import migrations


def update_pro_plan_amounts(apps, schema_editor):
    Plan = apps.get_model('billing', 'Plan')
    Plan.objects.filter(name='pro', interval='monthly').update(amount=Decimal('4999.00'))
    Plan.objects.filter(name='pro', interval='yearly').update(amount=Decimal('49999.00'))


def restore_pro_plan_amounts(apps, schema_editor):
    pass


class Migration(migrations.Migration):
    dependencies = [
        ('billing', '0012_add_yearly_pro_plan'),
    ]

    operations = [
        migrations.RunPython(update_pro_plan_amounts, restore_pro_plan_amounts),
    ]
