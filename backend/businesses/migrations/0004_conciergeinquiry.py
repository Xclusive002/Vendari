from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ('businesses', '0003_business_logo'),
    ]

    operations = [
        migrations.CreateModel(
            name='ConciergeInquiry',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('name', models.CharField(max_length=255)),
                ('business_name', models.CharField(max_length=255)),
                ('phone', models.CharField(max_length=50)),
                ('interest', models.TextField()),
                ('created_at', models.DateTimeField(auto_now_add=True)),
            ],
            options={
                'ordering': ('-created_at',),
            },
        ),
    ]
