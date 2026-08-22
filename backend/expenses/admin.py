from django.contrib import admin

from .models import Expense


@admin.register(Expense)
class ExpenseAdmin(admin.ModelAdmin):
    list_display = ('category', 'business', 'amount', 'date', 'payment_method')
    list_filter = ('business', 'category', 'date')
    search_fields = ('category', 'description', 'business__name')
