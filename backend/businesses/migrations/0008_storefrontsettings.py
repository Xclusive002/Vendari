from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('businesses', '0007_business_whatsapp_number'),
    ]

    operations = [
        migrations.CreateModel(
            name='StorefrontSettings',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('slug', models.CharField(db_index=True, max_length=80, unique=True)),
                ('is_published', models.BooleanField(default=False)),
                ('theme', models.CharField(default='classic', max_length=40)),
                ('primary_color', models.CharField(default='#4683EC', max_length=32)),
                ('accent_color', models.CharField(blank=True, default='', max_length=32)),
                ('banner_image', models.ImageField(blank=True, null=True, upload_to='storefront_banners/')),
                ('description', models.TextField(blank=True)),
                ('whatsapp_number', models.CharField(blank=True, default='', max_length=30)),
                ('social_links', models.JSONField(blank=True, default=dict)),
                ('delivery_option', models.CharField(choices=[('pickup', 'Pickup'), ('delivery', 'Delivery'), ('both', 'Both')], default='both', max_length=20)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('business', models.OneToOneField(on_delete=django.db.models.deletion.CASCADE, related_name='storefront_settings', to='businesses.business')),
            ],
            options={
                'ordering': ('slug',),
            },
        ),
    ]
