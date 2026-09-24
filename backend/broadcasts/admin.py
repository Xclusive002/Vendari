from django import forms
from django.contrib import admin, messages
from django.db import models, transaction

from accounts.models import User

from .models import Broadcast, BroadcastRecipient


class BroadcastRecipientInline(admin.TabularInline):
    model = BroadcastRecipient
    extra = 0
    can_delete = False
    readonly_fields = ('user', 'sent_at')


@admin.register(Broadcast)
class BroadcastAdmin(admin.ModelAdmin):
    list_display = ('subject', 'status', 'sent_count', 'total_recipients', 'created_at')
    list_filter = ('status', 'created_at')
    search_fields = ('subject', 'message_body')
    readonly_fields = ('status', 'created_at', 'sent_count', 'total_recipients')
    actions = ('queue_for_sending',)
    inlines = (BroadcastRecipientInline,)
    formfield_overrides = {
        models.TextField: {'widget': forms.Textarea(attrs={'rows': 12, 'style': 'width: 100%; max-width: 900px;'})},
    }

    @admin.action(description='Queue for sending')
    def queue_for_sending(self, request, queryset):
        queued = 0
        skipped = 0
        for broadcast in queryset.select_for_update():
            if broadcast.status != Broadcast.DRAFT:
                skipped += 1
                continue
            with transaction.atomic():
                users = User.objects.filter(email__isnull=False).exclude(email='').order_by('pk')
                BroadcastRecipient.objects.bulk_create(
                    [BroadcastRecipient(broadcast=broadcast, user=user) for user in users],
                    ignore_conflicts=True,
                )
                total = broadcast.recipients.count()
                broadcast.status = Broadcast.QUEUED
                broadcast.total_recipients = total
                broadcast.sent_count = 0
                broadcast.save(update_fields=('status', 'total_recipients', 'sent_count'))
                queued += 1
        if queued:
            self.message_user(request, f'{queued} broadcast(s) queued with a recipient snapshot.', messages.SUCCESS)
        if skipped:
            self.message_user(request, f'{skipped} broadcast(s) skipped because they were already queued or sent.', messages.WARNING)


@admin.register(BroadcastRecipient)
class BroadcastRecipientAdmin(admin.ModelAdmin):
    list_display = ('broadcast', 'user', 'sent_at')
    list_filter = ('sent_at',)
    search_fields = ('broadcast__subject', 'user__email')
    readonly_fields = ('broadcast', 'user', 'sent_at')
