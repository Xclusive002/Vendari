from django.contrib import admin

from .models import Sale


@admin.register(Sale)
class SaleAdmin(admin.ModelAdmin):
    list_display = ('product_name', 'business', 'quantity', 'total', 'sold_at')
    list_filter = ('business', 'payment_method', 'sold_at')
    search_fields = ('product_name', 'business__name')
