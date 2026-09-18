from datetime import timedelta

from django.contrib.auth import authenticate
from django.core.exceptions import ValidationError
from django.db import transaction
from django.utils.crypto import get_random_string
from django.utils import timezone
from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer

from businesses.models import Business, InviteCode, Membership
from billing.models import Plan

from .models import User


class RegisterSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True, min_length=8)
    business_name = serializers.CharField(max_length=255)

    def validate_email(self, value):
        existing_user = User.objects.filter(email__iexact=value).first()
        if existing_user:
            raise serializers.ValidationError('Registration could not be completed with these details.')
        return value.lower()

    @transaction.atomic
    def create(self, validated_data):
        existing_user = User.objects.filter(email__iexact=validated_data['email']).first()
        if existing_user:
            raise serializers.ValidationError('Registration could not be completed with these details.')

        user = User.objects.create_user(
            email=validated_data['email'],
            password=validated_data['password'],
        )
        business = Business.objects.create(
            owner=user,
            name=validated_data['business_name'],
            email=user.email,
        )
        paid_plan, _ = Plan.objects.get_or_create(
            name=Plan.PLAN_PRO,
            interval=Plan.INTERVAL_MONTHLY,
            defaults={'amount': 4999},
        )
        trial_started_at = timezone.now()
        business.plan = paid_plan
        business.trial_started_at = trial_started_at
        business.trial_ends_at = trial_started_at + timedelta(days=5)
        business.save(update_fields=['plan', 'trial_started_at', 'trial_ends_at'])
        Membership.objects.create(user=user, business=business, role=Membership.ROLE_OWNER)
        return user


class VerifyEmailSerializer(serializers.Serializer):
    email = serializers.EmailField(required=False)
    code = serializers.CharField(max_length=10, required=False, allow_blank=False)
    token = serializers.CharField(max_length=10, required=False, allow_blank=False)

    def validate(self, attrs):
        code = attrs.get('code') or attrs.get('token')
        if not code:
            raise serializers.ValidationError({'code': 'Verification code is required.'})
        if attrs.get('email'):
            attrs['email'] = attrs['email'].lower()
        attrs['code'] = code.strip()
        return attrs


class LoginSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True)

    def validate(self, attrs):
        user = authenticate(email=attrs['email'], password=attrs['password'])
        if user is None:
            raise serializers.ValidationError('Invalid email or password.')
        if not user.is_active:
            raise serializers.ValidationError('This account is inactive.')
        if not user.is_verified:
            raise serializers.ValidationError('Please verify your email before logging in.')
        attrs['user'] = user
        return attrs


class PasswordResetRequestSerializer(serializers.Serializer):
    email = serializers.EmailField()


class PasswordResetConfirmSerializer(serializers.Serializer):
    email = serializers.EmailField()
    code = serializers.CharField(min_length=6, max_length=12, trim_whitespace=True)
    password = serializers.CharField(write_only=True, min_length=8)


class InviteAcceptSerializer(serializers.Serializer):
    token = serializers.CharField(max_length=32)
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True, min_length=8, required=False)

    @transaction.atomic
    def create(self, validated_data):
        invite = InviteCode.objects.select_for_update().select_related('business').filter(
            code=validated_data['token'].upper(), used=False, revoked_at__isnull=True,
        ).first()
        if invite is None:
            raise serializers.ValidationError('Invalid or already used invite code.')

        if invite.expires_at and invite.expires_at <= timezone.now():
            raise serializers.ValidationError('This invite has expired.')

        email = validated_data['email'].lower()
        if invite.email and invite.email.lower() != email:
            raise serializers.ValidationError('This invite was created for a different email address.')
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