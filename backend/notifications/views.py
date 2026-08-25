from django.db.models import Q
from django.utils import timezone
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from businesses.models import Membership

from .models import Notification, NotificationRead
from .serializers import NotificationSerializer


class NotificationsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        business_ids = Membership.objects.filter(user=request.user).values('business_id')
        notifications = Notification.objects.filter(
            Q(business__isnull=True) | Q(business_id__in=business_ids),
        ).order_by('-created_at')
        return Response(NotificationSerializer(notifications, many=True, context={'request': request}).data)


class MarkNotificationReadView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, notification_id):
        business_ids = Membership.objects.filter(user=request.user).values('business_id')
        try:
            notification = Notification.objects.filter(
                Q(business__isnull=True) | Q(business_id__in=business_ids),
                pk=notification_id,
            ).get()
        except Notification.DoesNotExist:
            return Response({'detail': 'Notification not found.'}, status=status.HTTP_404_NOT_FOUND)
        NotificationRead.objects.get_or_create(notification=notification, user=request.user, defaults={'read_at': timezone.now()})
        return Response({'read': True})
