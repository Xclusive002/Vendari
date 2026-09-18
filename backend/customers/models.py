from decimal import Decimal
import math

from django.db import models
from django.db.models import DecimalField, Sum, Value
from django.db.models.functions import Coalesce
from django.utils import timezone

SEGMENT_NEW = 'New'
SEGMENT_REPEAT = 'Repeat'
SEGMENT_AT_RISK = 'At risk'
SEGMENT_INACTIVE = 'Inactive'
SEGMENT_TOP_SPENDER = 'Top spender'

SEGMENT_ORDER = [SEGMENT_NEW, SEGMENT_REPEAT, SEGMENT_AT_RISK, SEGMENT_INACTIVE, SEGMENT_TOP_SPENDER]
TOP_SPENDER_MINIMUM_CUSTOMERS = 10
TOP_SPENDER_PERCENTILE = 0.10


class CustomerReminder(models.Model):
    PAYMENT = 'payment'
    REENGAGEMENT = 'reengagement'
    REMINDER_TYPE_CHOICES = [
        (PAYMENT, 'Payment reminder'),
        (REENGAGEMENT, 'Re-engagement reminder'),
    ]

    business = models.ForeignKey('businesses.Business', related_name='customer_reminders', on_delete=models.CASCADE)
    customer = models.ForeignKey('Customer', related_name='reminders', on_delete=models.CASCADE)
    reminder_type = models.CharField(max_length=30, choices=REMINDER_TYPE_CHOICES, default=PAYMENT)
    subject = models.CharField(max_length=255, blank=True, default='')
    email = models.EmailField(blank=True)
    related_invoice = models.ForeignKey('invoices.Invoice', null=True, blank=True, related_name='customer_reminders', on_delete=models.SET_NULL)
    sent_at = models.DateTimeField(default=timezone.now)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ('-sent_at',)
        indexes = [
            models.Index(fields=['business', 'customer', 'reminder_type', 'sent_at']),
        ]

    def __str__(self):
        return f'{self.customer.name} - {self.reminder_type}'


class Customer(models.Model):
    business = models.ForeignKey('businesses.Business', related_name='customers', on_delete=models.CASCADE)
    name = models.CharField(max_length=255)
    phone = models.CharField(max_length=50)
    email = models.EmailField(blank=True)
    address = models.TextField(blank=True)
    notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.name

    @property
    def total_spent(self):
        from sales.models import Sale

        total = self.sales.aggregate(
            value=Coalesce(Sum('total'), Value(Decimal('0.00')), output_field=DecimalField(max_digits=12, decimal_places=2))
        )['value'] or Decimal('0.00')
        return total

    @property
    def order_count(self):
        return self.sales.count()

    @property
    def last_purchase_date(self):
        sale = self.sales.order_by('-sold_at').only('sold_at').first()
        if not sale:
            return None
        return sale.sold_at.date()

    @property
    def days_since_last_purchase(self):
        last_purchase_date = self.last_purchase_date
        if last_purchase_date is None:
            return None
        return (timezone.now().date() - last_purchase_date).days

    @property
    def owing_amount(self):
        from invoices.models import Invoice

        total = self.invoices.filter(doc_type=Invoice.INVOICE, status=Invoice.UNPAID).aggregate(
            value=Coalesce(Sum('total'), Value(Decimal('0.00')), output_field=DecimalField(max_digits=12, decimal_places=2))
        )['value'] or Decimal('0.00')
        return total

    @property
    def segment(self):
        order_count = self.order_count
        days_since_last_purchase = self.days_since_last_purchase

        if order_count < 2:
            return SEGMENT_NEW

        if days_since_last_purchase is not None and days_since_last_purchase <= 30:
            return SEGMENT_REPEAT

        if days_since_last_purchase is not None and 30 < days_since_last_purchase <= 60:
            return SEGMENT_AT_RISK

        if days_since_last_purchase is not None and days_since_last_purchase > 60:
            return SEGMENT_INACTIVE

        business_customer_count = self.business.customers.count()
        if business_customer_count >= TOP_SPENDER_MINIMUM_CUSTOMERS:
            totals = [customer.total_spent for customer in self.business.customers.all()]
            if totals:
                sorted_totals = sorted(totals, reverse=True)
                cutoff_index = max(0, math.ceil(len(sorted_totals) * TOP_SPENDER_PERCENTILE) - 1)
                threshold = sorted_totals[min(cutoff_index, len(sorted_totals) - 1)]
                if self.total_spent >= threshold:
                    return SEGMENT_TOP_SPENDER

        return SEGMENT_NEW

    @classmethod
    def segment_choices(cls):
        return SEGMENT_ORDER
