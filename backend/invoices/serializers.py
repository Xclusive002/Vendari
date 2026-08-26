from decimal import Decimal

from rest_framework import serializers

from customers.models import Customer
from sales.models import Sale

from .models import Invoice, InvoiceLineItem


class InvoiceLineItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = InvoiceLineItem
        fields = ('id', 'description', 'quantity', 'unit_price', 'line_total')
        read_only_fields = ('id', 'line_total')


class InvoiceSerializer(serializers.ModelSerializer):
    line_items = InvoiceLineItemSerializer(many=True)
    customer_name = serializers.CharField(source='customer.name', read_only=True, allow_null=True)

    class Meta:
        model = Invoice
        fields = ('id', 'business', 'customer', 'customer_name', 'doc_type', 'doc_number', 'status', 'issue_date', 'due_date', 'notes', 'subtotal', 'tax_amount', 'total', 'linked_sale', 'line_items')
        read_only_fields = ('id', 'business', 'doc_number', 'subtotal', 'total', 'linked_sale')

    def validate(self, attrs):
        business = self.context['business']
        customer = attrs.get('customer')
        if customer is not None and customer.business_id != business.id:
            raise serializers.ValidationError({'customer': 'The customer does not belong to this business.'})
        if attrs.get('due_date') and attrs.get('doc_type') == Invoice.RECEIPT:
            raise serializers.ValidationError({'due_date': 'Due date is only valid for invoices.'})
        return attrs

    def create(self, validated_data):
        line_items = validated_data.pop('line_items')
        business = validated_data.pop('business', self.context['business'])
        invoice = Invoice.objects.create(business=business, **validated_data)
        subtotal = Decimal('0.00')
        for line_item in line_items:
            item = InvoiceLineItem.objects.create(invoice=invoice, **line_item)
            subtotal += item.line_total
        invoice.subtotal = subtotal
        invoice.total = subtotal + invoice.tax_amount
        invoice.save(update_fields=('subtotal', 'total'))
        return invoice

    def update(self, instance, validated_data):
        line_items = validated_data.pop('line_items', None)
        instance = super().update(instance, validated_data)
        if line_items is not None:
            instance.line_items.all().delete()
            subtotal = Decimal('0.00')
            for line_item in line_items:
                item = InvoiceLineItem.objects.create(invoice=instance, **line_item)
                subtotal += item.line_total
            instance.subtotal = subtotal
            instance.total = subtotal + instance.tax_amount
            instance.save(update_fields=('subtotal', 'total'))
        return instance
