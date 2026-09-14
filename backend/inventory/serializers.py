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


class PublicInventoryItemSerializer(serializers.ModelSerializer):
    in_stock = serializers.SerializerMethodField()

    class Meta:
        model = InventoryItem
        fields = ('product_name', 'description', 'image', 'selling_price', 'in_stock')

    def get_in_stock(self, obj):
        return obj.qty_in_stock > 0

    def to_representation(self, instance):
        data = super().to_representation(instance)
        if instance.image:
            request = self.context.get('request')
            data['image'] = request.build_absolute_uri(instance.image.url) if request else instance.image.url
        return data