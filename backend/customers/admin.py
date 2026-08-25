from django.contrib import admin

from .models import Customer


@admin.register(Customer)
class CustomerAdmin(admin.ModelAdmin):
    list_display = ('name', 'phone', 'business')
    list_filter = ('business',)
    search_fields = ('name', 'phone', 'email', 'business__name')
