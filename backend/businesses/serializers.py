from django.conf import settings
from rest_framework import serializers

from .models import Business, ConciergeInquiry


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
        return data


class ConciergeInquirySerializer(serializers.ModelSerializer):
    class Meta:
        model = ConciergeInquiry
        fields = ('id', 'name', 'business_name', 'phone', 'interest', 'created_at')
        read_only_fields = ('id', 'created_at')