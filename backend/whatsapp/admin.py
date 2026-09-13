from django.contrib import admin

from .models import WhatsAppPendingAction


@admin.register(WhatsAppPendingAction)
class WhatsAppPendingActionAdmin(admin.ModelAdmin):
    list_display = ('business', 'phone_number', 'action_type', 'created_at')
    list_filter = ('action_type', 'created_at')
    search_fields = ('business__name', 'phone_number')
    readonly_fields = ('business', 'phone_number', 'action_type', 'payload', 'created_at')
