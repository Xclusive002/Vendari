from django.db import transaction
from rest_framework import serializers

from inventory.models import InventoryItem

from .models import Sale


class SaleSerializer(serializers.ModelSerializer):
    class Meta:
        model = Sale
        fields = '__all__'
        read_only_fields = ('business', 'product_name', 'unit_price', 'total', 'sold_at')

    @transaction.atomic
    def create(self, validated_data):
        business = self.context['business']
        item = validated_data.get('item')
        if item is None:
            raise serializers.ValidationError({'item': 'A linked inventory item is required.'})
        item = InventoryItem.objects.select_for_update().get(pk=item.pk)
        if item.business_id != business.id:
            raise serializers.ValidationError({'item': 'The inventory item does not belong to this business.'})
        quantity = validated_data['quantity']
        if quantity <= 0:
            raise serializers.ValidationError({'quantity': 'Quantity must be greater than zero.'})
        if item.qty_in_stock < quantity:
            raise serializers.ValidationError({'quantity': 'Sale would oversell available stock.'})
        validated_data.update(
            business=business,
            product_name=item.product_name,
            unit_price=item.selling_price,
            total=item.selling_price * quantity,
        )
        item.qty_in_stock -= quantity
        item.save(update_fields=('qty_in_stock', 'updated_at'))
        return Sale.objects.create(**validated_data)