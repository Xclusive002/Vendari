from django import forms
from django.contrib import admin, messages
from django.db import models, transaction
from django.http import HttpResponseRedirect
from django.shortcuts import get_object_or_404
from django.urls import path, reverse

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
    change_form_template = 'admin/broadcasts/broadcast/change_form.html'
    formfield_overrides = {
        models.TextField: {'widget': forms.Textarea(attrs={'rows': 12, 'style': 'width: 100%; max-width: 900px;'})},
    }

    @admin.action(description='Queue for sending')
    def queue_for_sending(self, request, queryset):
        queued, skipped = self._queue_broadcasts(queryset)
        if queued:
            self.message_user(request, f'{queued} broadcast(s) queued with a recipient snapshot.', messages.SUCCESS)
        if skipped:
            self.message_user(request, f'{skipped} broadcast(s) skipped because they were already queued or sent.', messages.WARNING)

    def get_urls(self):
        urls = super().get_urls()
        custom_urls = [
            path('<path:object_id>/queue/', self.admin_site.admin_view(self.queue_object), name='broadcasts_broadcast_queue'),
        ]
        return custom_urls + urls

    def _queue_broadcasts(self, queryset):
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
        return queued, skipped

    def queue_object(self, request, object_id):
        broadcast = get_object_or_404(Broadcast, pk=object_id)
        if request.method != 'POST':
            return HttpResponseRedirect(reverse('admin:broadcasts_broadcast_change', args=[broadcast.pk]))
        queued, skipped = self._queue_broadcasts(Broadcast.objects.filter(pk=broadcast.pk))
        if queued:
            self.message_user(request, 'Broadcast queued. Recipients were snapshotted; the external cron will send up to 50 emails per run.', messages.SUCCESS)
        elif skipped:
            self.message_user(request, 'This broadcast is already queued, sending, or sent.', messages.WARNING)
        return HttpResponseRedirect(reverse('admin:broadcasts_broadcast_change', args=[broadcast.pk]))


@admin.register(BroadcastRecipient)
class BroadcastRecipientAdmin(admin.ModelAdmin):
    list_display = ('broadcast', 'user', 'sent_at')
    list_filter = ('sent_at',)
    search_fields = ('broadcast__subject', 'user__email')
    readonly_fields = ('broadcast', 'user', 'sent_at')
