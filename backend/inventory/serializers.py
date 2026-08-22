from rest_framework import serializers

from .models import InventoryItem


class InventoryItemSerializer(serializers.ModelSerializer):
    is_low_stock = serializers.SerializerMethodField()

    class Meta:
        model = InventoryItem
        fields = '__all__'
        read_only_fields = ('business', 'is_low_stock', 'created_at', 'updated_at')

    def get_is_low_stock(self, obj):
        return obj.qty_in_stock <= obj.reorder_level