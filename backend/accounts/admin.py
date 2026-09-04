from django.contrib import admin
from django.contrib.admin import helpers
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from django.core.mail import send_mail
from django.http import HttpResponseRedirect
from django.shortcuts import render
from django.urls import path, reverse
from django.utils.html import format_html

from .models import User


@admin.register(User)
class UserAdmin(BaseUserAdmin):
    model = User
    ordering = ('email',)
    list_display = ('email', 'is_verified', 'is_staff', 'is_active', 'date_joined')
    search_fields = ('email',)
    list_filter = ('is_verified', 'is_staff', 'is_active')
    actions = ('send_email_to_selected',)

    @admin.action(description='Send email to selected users')
    def send_email_to_selected(self, request, queryset):
        user_ids = list(queryset.values_list('pk', flat=True))
        if not user_ids:
            self.message_user(request, 'Select at least one user.', level='error')
            return None
        request.session['selected_email_user_ids'] = user_ids
        return HttpResponseRedirect(reverse('admin:accounts_user_send_email'))

    def get_urls(self):
        urls = super().get_urls()
        custom_urls = [
            path('send-email/', self.admin_site.admin_view(self.send_email_view), name='accounts_user_send_email'),
        ]
        return custom_urls + urls

    def send_email_view(self, request):
        user_ids = request.session.get('selected_email_user_ids', [])
        users = User.objects.filter(pk__in=user_ids, is_active=True).order_by('email')
        if not users.exists():
            self.message_user(request, 'No active users were selected.', level='error')
            return HttpResponseRedirect(reverse('admin:accounts_user_changelist'))

        if request.method == 'POST':
            subject = request.POST.get('subject', '').strip()
            body = request.POST.get('body', '').strip()
            if not subject or not body:
                self.message_user(request, 'Subject and message are required.', level='error')
            else:
                sent = 0
                for user in users:
                    sent += send_mail(subject, body, None, [user.email], fail_silently=False)
                request.session.pop('selected_email_user_ids', None)
                self.message_user(request, format_html('Email sent to {} selected user{}.', sent, '' if sent == 1 else 's'))
                return HttpResponseRedirect(reverse('admin:accounts_user_changelist'))

        context = {
            **self.admin_site.each_context(request),
            'title': 'Send email to selected users',
            'users': users,
            'opts': self.model._meta,
            'action_checkbox_name': helpers.ACTION_CHECKBOX_NAME,
        }
        return render(request, 'admin/accounts/user/send_email.html', context)

    fieldsets = (
        (None, {'fields': ('email', 'password')}),
        ('Permissions', {'fields': ('is_active', 'is_staff', 'is_superuser', 'groups', 'user_permissions')}),
        ('Verification', {'fields': ('is_verified',)}),
        ('Important dates', {'fields': ('last_login', 'date_joined')}),
    )

    add_fieldsets = (
        (None, {
            'classes': ('wide',),
            'fields': ('email', 'password1', 'password2'),
        }),
    )
