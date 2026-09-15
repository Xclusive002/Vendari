from django.conf import settings
from django.core.exceptions import ValidationError
from rest_framework import serializers

from .models import Business, ConciergeInquiry, StorefrontSettings


class StorefrontSettingsSerializer(serializers.ModelSerializer):
    logo = serializers.SerializerMethodField()

    class Meta:
        model = StorefrontSettings
        fields = [
            'id', 'business', 'slug', 'is_published', 'theme', 'primary_color', 'accent_color',
            'logo', 'banner_image', 'description', 'whatsapp_number', 'social_links', 'delivery_option',
            'created_at', 'updated_at',
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


class BusinessSerializer(serializers.ModelSerializer):
    logo = serializers.ImageField(required=False, allow_null=True)
    has_complete_profile = serializers.BooleanField(read_only=True)
    whatsapp_service_number = serializers.SerializerMethodField()

    def get_whatsapp_service_number(self, instance):
        return getattr(settings, 'WHATSAPP_DISPLAY_NUMBER', '')

    def validate_whatsapp_number(self, value):
        value = ''.join(character for character in value.strip() if character.isdigit())
        return value or None

    class Meta:
        model = Business
        fields = '__all__'
        read_only_fields = ('owner', 'created_at', 'updated_at', 'bank_code', 'bank_account_number', 'bank_account_name', 'paystack_subaccount_code', 'platform_fee_percentage')

    def to_representation(self, instance):
        data = super().to_representation(instance)
        if instance.logo:
            request = self.context.get('request')
            data['logo'] = request.build_absolute_uri(instance.logo.url) if request else instance.logo.url
        data['has_payments_enabled'] = instance.has_payments_enabled
        return data


class ConciergeInquirySerializer(serializers.ModelSerializer):
    class Meta:
        model = ConciergeInquiry
        fields = ('id', 'name', 'business_name', 'phone', 'interest', 'created_at')
        read_only_fields = ('id', 'created_at')