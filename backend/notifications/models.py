from django.conf import settings
from django.db import models


class Notification(models.Model):
    business = models.ForeignKey(
        'businesses.Business',
        null=True,
        blank=True,
        related_name='notifications',
        on_delete=models.CASCADE,
    )
    title = models.CharField(max_length=255)
    message = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)
    link = models.URLField(blank=True)

    def __str__(self):
        return self.title


class NotificationRead(models.Model):
    notification = models.ForeignKey(Notification, related_name='reads', on_delete=models.CASCADE)
    user = models.ForeignKey(settings.AUTH_USER_MODEL, related_name='notification_reads', on_delete=models.CASCADE)
    read_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(fields=('notification', 'user'), name='unique_notification_read'),
        ]
