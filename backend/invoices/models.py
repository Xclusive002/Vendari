from datetime import date
from decimal import Decimal

from django.db import models, transaction


class Invoice(models.Model):
    RECEIPT = 'receipt'
    INVOICE = 'invoice'
    DOC_TYPE_CHOICES = ((RECEIPT, 'Receipt'), (INVOICE, 'Invoice'))
    PAID = 'paid'
    UNPAID = 'unpaid'
    PARTIAL = 'partial'
    STATUS_CHOICES = ((PAID, 'Paid'), (UNPAID, 'Unpaid'), (PARTIAL, 'Partial'))

    business = models.ForeignKey('businesses.Business', related_name='invoices', on_delete=models.CASCADE)
    customer = models.ForeignKey('customers.Customer', null=True, blank=True, related_name='invoices', on_delete=models.SET_NULL)
    doc_type = models.CharField(max_length=20, choices=DOC_TYPE_CHOICES)
    doc_number = models.CharField(max_length=32)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES)
    issue_date = models.DateField(default=date.today)
    due_date = models.DateField(null=True, blank=True)
    notes = models.TextField(blank=True)
    subtotal = models.DecimalField(max_digits=12, decimal_places=2, default=Decimal('0.00'))
    tax_amount = models.DecimalField(max_digits=12, decimal_places=2, default=Decimal('0.00'))
    total = models.DecimalField(max_digits=12, decimal_places=2, default=Decimal('0.00'))
    linked_sale = models.ForeignKey('sales.Sale', null=True, blank=True, related_name='receipts', on_delete=models.SET_NULL)

    class Meta:
        constraints = [
            models.UniqueConstraint(fields=('business', 'doc_type', 'doc_number'), name='unique_invoice_number_per_business_type'),
        ]

    def save(self, *args, **kwargs):
        if self.doc_number:
            return super().save(*args, **kwargs)
        with transaction.atomic():
            business = type(self.business).objects.select_for_update().get(pk=self.business_id)
            prefix = 'RCT' if self.doc_type == self.RECEIPT else 'INV'
            latest = Invoice.objects.filter(business=business, doc_type=self.doc_type, doc_number__startswith=f'{prefix}-').order_by('-doc_number').first()
            next_number = int(latest.doc_number.rsplit('-', 1)[1]) + 1 if latest else 1
            self.doc_number = f'{prefix}-{next_number:04d}'
            return super().save(*args, **kwargs)


class InvoiceLineItem(models.Model):
    invoice = models.ForeignKey(Invoice, related_name='line_items', on_delete=models.CASCADE)
    description = models.CharField(max_length=255)
    quantity = models.IntegerField()
    unit_price = models.DecimalField(max_digits=12, decimal_places=2)
    line_total = models.DecimalField(max_digits=12, decimal_places=2, default=Decimal('0.00'))

    def save(self, *args, **kwargs):
        self.line_total = Decimal(self.quantity) * self.unit_price
        return super().save(*args, **kwargs)


class InvoicePayment(models.Model):
    invoice = models.ForeignKey(Invoice, related_name='payments', on_delete=models.CASCADE)
    paystack_reference = models.CharField(max_length=255, unique=True)
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    status = models.CharField(max_length=20, default='success')
    paid_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ('-paid_at',)
