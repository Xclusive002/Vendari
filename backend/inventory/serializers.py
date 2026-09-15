from rest_framework import serializers

from .models import InventoryItem, InventoryItemImage


class InventoryItemSerializer(serializers.ModelSerializer):
    is_low_stock = serializers.SerializerMethodField()
    images = serializers.ListField(child=serializers.ImageField(), required=False, write_only=True)
    gallery = serializers.SerializerMethodField(read_only=True)

    class Meta:
        model = InventoryItem
        fields = tuple(field.name for field in InventoryItem._meta.fields) + ('images', 'gallery', 'is_low_stock')
        read_only_fields = ('business', 'is_low_stock', 'created_at', 'updated_at')

    def get_is_low_stock(self, obj):
        return obj.qty_in_stock <= obj.reorder_level

    def create(self, validated_data):
        images = validated_data.pop('images', [])
        if len(images) > 6:
            raise serializers.ValidationError({'images': 'A product can have a maximum of 6 images.'})
        validated_data.setdefault(
            'is_visible_on_storefront',
            bool(validated_data.get('selling_price') and validated_data['selling_price'] > 0),
        )
        item = super().create(validated_data)
        if images and not item.image:
            item.image = images[0]
            item.save(update_fields=('image',))
        for image in images[1:]:
            InventoryItemImage.objects.create(item=item, image=image)
        return item

    def update(self, instance, validated_data):
        images = validated_data.pop('images', None)
        item = super().update(instance, validated_data)
        if images is not None:
            if len(images) > 6:
                raise serializers.ValidationError({'images': 'A product can have a maximum of 6 images.'})
            InventoryItemImage.objects.filter(item=item).delete()
            item.image = images[0] if images else None
            item.save(update_fields=('image',))
            for image in images[1:]:
                InventoryItemImage.objects.create(item=item, image=image)
        return item

    def get_gallery(self, obj):
        request = self.context.get('request')
        urls = []
        if obj.image:
            urls.append(request.build_absolute_uri(obj.image.url) if request else obj.image.url)
        for image in obj.gallery_images.all()[:5]:
            urls.append(request.build_absolute_uri(image.image.url) if request else image.image.url)
        return urls


class PublicInventoryItemSerializer(serializers.ModelSerializer):
    in_stock = serializers.SerializerMethodField()
    images = serializers.SerializerMethodField()

    class Meta:
        model = InventoryItem
        fields = ('id', 'product_name', 'description', 'image', 'images', 'selling_price', 'in_stock')

    def get_in_stock(self, obj):
        return obj.qty_in_stock > 0

    def to_representation(self, instance):
        data = super().to_representation(instance)
        if instance.image:
            request = self.context.get('request')
            data['image'] = request.build_absolute_uri(instance.image.url) if request else instance.image.url
        return data

    def get_images(self, obj):
        request = self.context.get('request')
        urls = []
        if obj.image:
            urls.append(request.build_absolute_uri(obj.image.url) if request else obj.image.url)
        for image in obj.gallery_images.all()[:5]:
            urls.append(request.build_absolute_uri(image.image.url) if request else image.image.url)
        return urls