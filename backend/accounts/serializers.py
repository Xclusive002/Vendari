from django.contrib.auth import authenticate
from django.core.exceptions import ValidationError
from django.db import transaction
from django.utils.crypto import get_random_string
from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer

from businesses.models import Business, InviteCode, Membership

from .models import EmailVerificationToken, User


class RegisterSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True, min_length=8)
    business_name = serializers.CharField(max_length=255)

    def validate_email(self, value):
        if User.objects.filter(email__iexact=value).exists():
            raise serializers.ValidationError('A user with this email already exists.')
        return value.lower()

    @transaction.atomic
    def create(self, validated_data):
        user = User.objects.create_user(
            email=validated_data['email'],
            password=validated_data['password'],
        )
        business = Business.objects.create(
            owner=user,
            name=validated_data['business_name'],
            email=user.email,
        )
        Membership.objects.create(user=user, business=business, role=Membership.ROLE_OWNER)
        verification = EmailVerificationToken.objects.create(user=user)
        return user, verification


class VerifyEmailSerializer(serializers.Serializer):
    token = serializers.UUIDField()


class LoginSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True)

    def validate(self, attrs):
        user = authenticate(email=attrs['email'], password=attrs['password'])
        if user is None:
            raise serializers.ValidationError('Invalid email or password.')
        if not user.is_verified:
            raise serializers.ValidationError('Please verify your email before logging in.')
        if not user.is_active:
            raise serializers.ValidationError('This account is inactive.')
        attrs['user'] = user
        return attrs


class InviteAcceptSerializer(serializers.Serializer):
    token = serializers.CharField(max_length=32)
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True, min_length=8, required=False)

    @transaction.atomic
    def create(self, validated_data):
        invite = InviteCode.objects.select_for_update().select_related('business').filter(
            code=validated_data['token'].upper(), used=False,
        ).first()
        if invite is None:
            raise serializers.ValidationError('Invalid or already used invite code.')

        email = validated_data['email'].lower()
        user = User.objects.filter(email__iexact=email).first()
        if user is None:
            if not validated_data.get('password'):
                raise serializers.ValidationError({'password': 'This field is required for new users.'})
            user = User.objects.create_user(email=email, password=validated_data['password'], is_verified=True)
        elif not user.is_active:
            raise serializers.ValidationError('This account is inactive.')

        membership, created = Membership.objects.get_or_create(
            user=user,
            business=invite.business,
            defaults={'role': invite.role},
        )
        if not created:
            raise serializers.ValidationError('This user is already a member of this business.')
        invite.used = True
        invite.save(update_fields=['used'])
        return user, invite.business, membership