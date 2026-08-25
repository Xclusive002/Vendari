from django.urls import path

from .views import MarkNotificationReadView, NotificationsView

urlpatterns = [
    path('', NotificationsView.as_view(), name='notifications'),
    path('<int:notification_id>/mark-read/', MarkNotificationReadView.as_view(), name='notification-mark-read'),
]
