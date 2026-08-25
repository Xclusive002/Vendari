from django.contrib import admin

from .models import Notification


@admin.register(Notification)
class NotificationAdmin(admin.ModelAdmin):
    list_display = ('title', 'business', 'created_at')
    list_filter = ('business', 'created_at')
    search_fields = ('title', 'message', 'business__name')
