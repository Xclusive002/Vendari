from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):
    initial = True

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.CreateModel(
            name='Broadcast',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('subject', models.CharField(max_length=255)),
                ('message_body', models.TextField()),
                ('status', models.CharField(choices=[('draft', 'Draft'), ('queued', 'Queued'), ('sending', 'Sending'), ('sent', 'Sent')], default='draft', max_length=20)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('sent_count', models.PositiveIntegerField(default=0)),
                ('total_recipients', models.PositiveIntegerField(default=0)),
            ],
            options={'ordering': ('-created_at',)},
        ),
        migrations.CreateModel(
            name='BroadcastRecipient',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('sent_at', models.DateTimeField(blank=True, null=True)),
                ('broadcast', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='recipients', to='broadcasts.broadcast')),
                ('user', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='broadcast_recipients', to=settings.AUTH_USER_MODEL)),
            ],
            options={'ordering': ('id',), 'constraints': [models.UniqueConstraint(fields=('broadcast', 'user'), name='unique_broadcast_recipient')]},
        ),
    ]
