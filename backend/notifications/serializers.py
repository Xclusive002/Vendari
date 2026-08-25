from rest_framework import serializers

from .models import Notification


class NotificationSerializer(serializers.ModelSerializer):
    read = serializers.SerializerMethodField()

    class Meta:
        model = Notification
        fields = ('id', 'title', 'message', 'created_at', 'link', 'read')

    def get_read(self, notification):
        user = self.context['request'].user
        return notification.reads.filter(user=user).exists()
