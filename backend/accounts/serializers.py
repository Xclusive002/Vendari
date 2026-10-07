from datetime import timedelta

from django.conf import settings
from django.contrib.auth import authenticate
from django.core.exceptions import ValidationError
from django.db import transaction
from django.db.models import Q
from django.utils.crypto import get_random_string
from django.utils import timezone
from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer

from businesses.models import Business, InviteCode, Membership
from billing.models import Plan
from referrals.models import Referral, ReferralCode

from .models import User


class RegisterSerializer(serializers.Serializer):
    full_name = serializers.CharField(max_length=255, required=False, allow_blank=True, default='')
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True, min_length=8)
    business_name = serializers.CharField(max_length=255)
    referral_code = serializers.CharField(max_length=8, required=False, allow_blank=True, trim_whitespace=True)
    signup_device_hash = serializers.CharField(max_length=128, required=False, allow_blank=True, default='')

    def validate_email(self, value):
        existing_user = User.objects.filter(email__iexact=value).first()
        if existing_user:
            raise serializers.ValidationError('Registration could not be completed with these details.')
        return value.lower()

    @staticmethod
    def _client_ip(request):
        if not request:
            return None
        return request.META.get('REMOTE_ADDR')

    @staticmethod
    def _apply_referral_signup(user, referral_code, signup_ip=None, signup_device_hash=''):
        if not referral_code:
            return None

        referral_code_obj = ReferralCode.objects.select_related('user').filter(code=referral_code.upper()).first()
        if referral_code_obj is None:
            return None

        if referral_code_obj.user_id == user.pk:
            return None

        if Referral.objects.filter(referred_user=user).exists():
            return None

        if referral_code_obj.user.email.lower() == user.email.lower():
            return Referral.objects.create(
                referrer=referral_code_obj.user,
                referred_user=user,
                code_used=referral_code_obj,
                status=Referral.STATUS_REJECTED,
                rejection_reason='Self-referral blocked: referral code belongs to the same email address.',
                signup_ip=signup_ip,
                signup_device_hash=signup_device_hash,
            )

        referral = Referral.objects.create(
            referrer=referral_code_obj.user,
            referred_user=user,
            code_used=referral_code_obj,
            status=Referral.STATUS_SIGNED_UP,
            signup_ip=signup_ip,
            signup_device_hash=signup_device_hash,
        )
        business = Business.objects.filter(owner=user).first()
        if business is not None:
            trial_started_at = timezone.now()
            trial_days = settings.REFERRAL_SETTINGS.get('REFERRED_TRIAL_DAYS', 14)
            business.trial_started_at = trial_started_at
            business.trial_ends_at = trial_started_at + timedelta(days=trial_days)
            business.save(update_fields=['trial_started_at', 'trial_ends_at'])
        return referral

    @transaction.atomic
    def create(self, validated_data):
        existing_user = User.objects.filter(email__iexact=validated_data['email']).first()
        if existing_user:
            raise serializers.ValidationError('Registration could not be completed with these details.')

        referral_code = validated_data.pop('referral_code', '').strip()
        signup_device_hash = str(validated_data.pop('signup_device_hash', '') or '').strip()
        request = self.context.get('request')
        signup_ip = self._client_ip(request)

        user = User.objects.create_user(
            email=validated_data['email'],
            password=validated_data['password'],
            full_name=validated_data['full_name'].strip(),
        )
        ReferralCode.objects.get_or_create(user=user)

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
        default_trial_days = 5
        trial_started_at = timezone.now()
        business.plan = paid_plan
        business.trial_started_at = trial_started_at
        business.trial_ends_at = trial_started_at + timedelta(days=default_trial_days)
        business.save(update_fields=['plan', 'trial_started_at', 'trial_ends_at'])

        self._apply_referral_signup(user, referral_code, signup_ip=signup_ip, signup_device_hash=signup_device_hash)

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