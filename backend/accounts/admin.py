from django.contrib import admin
from django.contrib.admin import helpers
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from django.conf import settings
from django.core.mail import EmailMultiAlternatives
from django.http import HttpResponseRedirect
from django.shortcuts import render
from django.template.loader import render_to_string
from django.urls import path, reverse
import logging

from .models import User

logger = logging.getLogger(__name__)


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
        try:
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
                    failed = []
                    for user in users:
                        try:
                            html_body = render_to_string('emails/admin_selected_user.html', {
                                'subject': subject,
                                'message': body,
                                'recipient': user,
                            })
                            email = EmailMultiAlternatives(
                                subject=subject,
                                body=body,
                                from_email=getattr(settings, 'ADMIN_EMAIL_FROM', settings.DEFAULT_FROM_EMAIL),
                                to=[user.email],
                            )
                            email.attach_alternative(html_body, 'text/html')
                            sent += email.send(fail_silently=False)
                        except Exception:
                            logger.exception('Selected-user email failed for user=%s', user.pk)
                            failed.append(user.email)
                    message = f'Email sent to {sent} user{"" if sent == 1 else "s"}.'
                    if failed:
                        message += f' Failed for {len(failed)} recipient{"" if len(failed) == 1 else "s"}.'
                    self.message_user(request, message, level='warning' if failed else 'success')
                    request.session.pop('selected_email_user_ids', None)
                    return HttpResponseRedirect(reverse('admin:accounts_user_changelist'))

            context = {
                **self.admin_site.each_context(request),
                'title': 'Send email to selected users',
                'users': users,
                'opts': self.model._meta,
                'action_checkbox_name': helpers.ACTION_CHECKBOX_NAME,
            }
            return render(request, 'admin/accounts/user/send_email.html', context)
        except Exception:
            logger.exception('Selected-user email page failed')
            self.message_user(request, 'The email could not be sent. Please check the email settings and try again.', level='error')
            return HttpResponseRedirect(reverse('admin:accounts_user_changelist'))

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
