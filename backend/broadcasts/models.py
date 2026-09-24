from django.conf import settings
from django.db import models


class Broadcast(models.Model):
    DRAFT = 'draft'
    QUEUED = 'queued'
    SENDING = 'sending'
    SENT = 'sent'
    STATUS_CHOICES = [
        (DRAFT, 'Draft'),
        (QUEUED, 'Queued'),
        (SENDING, 'Sending'),
        (SENT, 'Sent'),
    ]

    subject = models.CharField(max_length=255)
    message_body = models.TextField()
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default=DRAFT)
    created_at = models.DateTimeField(auto_now_add=True)
    sent_count = models.PositiveIntegerField(default=0)
    total_recipients = models.PositiveIntegerField(default=0)

    class Meta:
        ordering = ('-created_at',)

    def __str__(self):
        return f'{self.subject} ({self.get_status_display()})'


class BroadcastRecipient(models.Model):
    broadcast = models.ForeignKey(Broadcast, on_delete=models.CASCADE, related_name='recipients')
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='broadcast_recipients')
    sent_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(fields=('broadcast', 'user'), name='unique_broadcast_recipient'),
        ]
        ordering = ('id',)

    def __str__(self):
        return f'{self.broadcast.subject} -> {self.user.email}'
