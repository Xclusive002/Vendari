from django.conf import settings
from django.core.exceptions import ValidationError
from rest_framework import serializers

from .models import Business, ConciergeInquiry, GalleryImage, Service, StorefrontOrder, StorefrontSettings

MAX_IMAGE_SIZE = 5 * 1024 * 1024


class BoundedImageField(serializers.ImageField):
    def to_internal_value(self, data):
        if getattr(data, 'size', 0) > MAX_IMAGE_SIZE:
            raise serializers.ValidationError('Images must be 5 MB or smaller.')
        return super().to_internal_value(data)


class StorefrontSettingsSerializer(serializers.ModelSerializer):
    logo = serializers.SerializerMethodField()
    banner_image = BoundedImageField(required=False, allow_null=True)

    class Meta:
        model = StorefrontSettings
        fields = [
            'id', 'business', 'slug', 'is_published', 'theme', 'primary_color', 'accent_color',
            'logo', 'banner_image', 'description', 'about', 'whatsapp_number', 'social_links', 'delivery_option',
            'opening_hours', 'business_type_hint', 'product_display_mode', 'created_at', 'updated_at',
        ]
        read_only_fields = ('id', 'business', 'created_at', 'updated_at')

    def validate_slug(self, value):
        request = self.context.get('request')
        business = getattr(self.instance, 'business', None)
        if request and request.parser_context.get('kwargs', {}).get('business_id'):
            business = Business.objects.filter(pk=request.parser_context['kwargs']['business_id']).first() or business
        try:
            normalized = StorefrontSettings.validate_slug_candidate(value, business=business)
        except ValidationError as exc:
            raise serializers.ValidationError(str(exc))
        return normalized

    def validate_social_links(self, value):
        if value is None:
            value = {}
        if not isinstance(value, dict):
            raise serializers.ValidationError('Social links must be an object.')
        unsupported = set(value) - set(StorefrontSettings.SOCIAL_LINK_KEYS)
        if unsupported:
            raise serializers.ValidationError(f'Unsupported social link(s): {", ".join(sorted(unsupported))}.')
        normalized = {}
        for key in StorefrontSettings.SOCIAL_LINK_KEYS:
            url = str(value.get(key, '') or '').strip()
            if url and not url.lower().startswith(('http://', 'https://')):
                raise serializers.ValidationError({key: 'Enter a full URL starting with http:// or https://.'})
            normalized[key] = url
        return normalized

    def to_representation(self, instance):
        data = super().to_representation(instance)
        request = self.context.get('request')
        if instance.banner_image:
            data['banner_image'] = request.build_absolute_uri(instance.banner_image.url) if request else instance.banner_image.url
        return data

    def get_logo(self, instance):
        logo = instance.business.logo
        if not logo:
            return None
        request = self.context.get('request')
        return request.build_absolute_uri(logo.url) if request else logo.url


class PublicStorefrontSerializer(serializers.ModelSerializer):
    logo = serializers.SerializerMethodField()
    banner_image = serializers.SerializerMethodField()

    class Meta:
        model = StorefrontSettings
        fields = ('slug', 'theme', 'primary_color', 'accent_color', 'logo', 'banner_image', 'description', 'about', 'whatsapp_number', 'social_links', 'delivery_option', 'opening_hours', 'business_type_hint', 'product_display_mode')

    def _absolute_url(self, value):
        if not value:
            return None
        request = self.context.get('request')
        return request.build_absolute_uri(value.url) if request else value.url

    def get_logo(self, instance):
        return self._absolute_url(instance.business.logo)

    def get_banner_image(self, instance):
        return self._absolute_url(instance.banner_image)


class ServiceSerializer(serializers.ModelSerializer):
    image = serializers.ImageField(required=False, allow_null=True)

    class Meta:
        model = Service
        fields = ('id', 'business', 'name', 'description', 'price', 'image', 'is_visible_on_storefront', 'display_order')
        read_only_fields = ('id', 'business')

    def to_representation(self, instance):
        data = super().to_representation(instance)
        if instance.image:
            request = self.context.get('request')
            data['image'] = request.build_absolute_uri(instance.image.url) if request else instance.image.url
        return data


class GalleryImageSerializer(serializers.ModelSerializer):
    class Meta:
        model = GalleryImage
        fields = ('id', 'business', 'image', 'caption', 'display_order')
        read_only_fields = ('id', 'business')

    def to_representation(self, instance):
        data = super().to_representation(instance)
        request = self.context.get('request')
        data['image'] = request.build_absolute_uri(instance.image.url) if request else instance.image.url
        return data


class PublicServiceSerializer(serializers.ModelSerializer):
    image = serializers.SerializerMethodField()

    class Meta:
        model = Service
        fields = ('name', 'description', 'price', 'image')

    def get_image(self, instance):
        if not instance.image:
            return None
        request = self.context.get('request')
        return request.build_absolute_uri(instance.image.url) if request else instance.image.url


class PublicGalleryImageSerializer(serializers.ModelSerializer):
    image = serializers.SerializerMethodField()

    class Meta:
        model = GalleryImage
        fields = ('image', 'caption')

    def get_image(self, instance):
        request = self.context.get('request')
        return request.build_absolute_uri(instance.image.url) if request else instance.image.url


class BusinessSerializer(serializers.ModelSerializer):
    logo = BoundedImageField(required=False, allow_null=True)
    has_complete_profile = serializers.BooleanField(read_only=True)
    whatsapp_service_number = serializers.SerializerMethodField()

    def get_whatsapp_service_number(self, instance):
        return getattr(settings, 'WHATSAPP_DISPLAY_NUMBER', '')

    def validate_whatsapp_number(self, value):
        value = ''.join(character for character in value.strip() if character.isdigit())
        return value or None

    class Meta:
        model = Business
        fields = tuple(
            field.name for field in Business._meta.fields
            if field.name not in {'bank_code', 'bank_account_number', 'bank_account_name', 'paystack_subaccount_code'}
        ) + ('has_complete_profile', 'whatsapp_service_number')
        read_only_fields = ('owner', 'created_at', 'updated_at', 'bank_code', 'bank_account_number', 'bank_account_name', 'paystack_subaccount_code', 'platform_fee_percentage')

    def to_representation(self, instance):
        data = super().to_representation(instance)
        if instance.logo:
            request = self.context.get('request')
            data['logo'] = request.build_absolute_uri(instance.logo.url) if request else instance.logo.url
        data['bank_code'] = instance.bank_code
        data['bank_account_name'] = instance.bank_account_name
        data['bank_account_number'] = f'••••••{instance.bank_account_number[-4:]}' if instance.bank_account_number else ''
        data['paystack_subaccount_code'] = instance.paystack_subaccount_code
        data['has_payments_enabled'] = instance.has_payments_enabled
        return data


class StorefrontOrderSerializer(serializers.ModelSerializer):
    line_items = serializers.SerializerMethodField()

    class Meta:
        model = StorefrontOrder
        fields = ('id', 'customer_name', 'customer_phone', 'customer_address', 'delivery_option', 'status', 'payout_status', 'settled_at', 'created_at', 'total', 'paystack_reference', 'line_items')

    def get_line_items(self, instance):
        return [
            {'product_name': line.inventory_item.product_name, 'quantity': line.quantity, 'unit_price': line.unit_price, 'line_total': line.line_total}
            for line in instance.line_items.select_related('inventory_item').all()
        ]


class ConciergeInquirySerializer(serializers.ModelSerializer):
    class Meta:
        model = ConciergeInquiry
        fields = ('id', 'name', 'business_name', 'phone', 'interest', 'created_at')
        read_only_fields = ('id', 'created_at')