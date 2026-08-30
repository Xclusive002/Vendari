from django import forms
from django.contrib import admin

from .models import Notification


class NotificationAdminForm(forms.ModelForm):
    send_to_all_users = forms.BooleanField(
        required=False,
        label='Send to all app users',
        help_text='If checked, this notification will be visible to every authenticated user in the app.',
    )

    class Meta:
        model = Notification
        fields = '__all__'

    def clean(self):
        cleaned_data = super().clean()
        send_to_all_users = cleaned_data.get('send_to_all_users')
        business = cleaned_data.get('business')

        if send_to_all_users:
            cleaned_data['business'] = None
            return cleaned_data

        if business is None:
            raise forms.ValidationError('Choose a business or tick “Send to all app users”.')

        return cleaned_data


@admin.register(Notification)
class NotificationAdmin(admin.ModelAdmin):
    form = NotificationAdminForm
    list_display = ('title', 'business', 'created_at')
    list_filter = ('business', 'created_at')
    search_fields = ('title', 'message', 'business__name')
    fieldsets = (
        ('Notification', {
            'fields': ('title', 'message', 'link', 'business', 'send_to_all_users'),
        }),
    )

    def save_model(self, request, obj, form, change):
        if form.cleaned_data.get('send_to_all_users'):
            obj.business = None
        super().save_model(request, obj, form, change)
