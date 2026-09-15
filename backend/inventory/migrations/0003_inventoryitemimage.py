from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):
    dependencies = [
        ('inventory', '0002_inventoryitem_description_inventoryitem_image_and_more'),
    ]

    operations = [
        migrations.CreateModel(
            name='InventoryItemImage',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('image', models.ImageField(upload_to='inventory/gallery/')),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('item', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='gallery_images', to='inventory.inventoryitem')),
            ],
            options={'ordering': ('created_at', 'id')},
        ),
    ]