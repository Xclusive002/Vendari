from django.contrib import admin

from .models import InventoryItem


@admin.register(InventoryItem)
class InventoryItemAdmin(admin.ModelAdmin):
    list_display = ('product_name', 'business', 'qty_in_stock', 'reorder_level', 'selling_price')
    list_filter = ('business', 'category')
    search_fields = ('product_name', 'code', 'business__name')
