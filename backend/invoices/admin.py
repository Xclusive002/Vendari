from django.contrib import admin

from .models import Invoice, InvoiceLineItem


class InvoiceLineItemInline(admin.TabularInline):
    model = InvoiceLineItem
    extra = 0
    readonly_fields = ('line_total',)


@admin.register(Invoice)
class InvoiceAdmin(admin.ModelAdmin):
    list_display = ('doc_number', 'doc_type', 'business', 'customer', 'status', 'total', 'issue_date')
    list_filter = ('doc_type', 'status', 'business')
    search_fields = ('doc_number', 'business__name', 'customer__name')
    inlines = (InvoiceLineItemInline,)
