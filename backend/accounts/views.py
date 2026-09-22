import logging
import random
import secrets
import threading
import urllib.error
import urllib.parse
import urllib.request
import json
from datetime import timedelta

from django.conf import settings
from django.core.mail import EmailMultiAlternatives
from django.core.signing import BadSignature, SignatureExpired, TimestampSigner
from django.db import transaction
from django.contrib.auth.hashers import check_password, make_password
from django.shortcuts import redirect
from django.utils import timezone
from rest_framework import status
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken

from businesses.models import Business, Membership
from billing.models import Plan
from vendari_api.rate_limits import rate_limited, too_many_requests
from .models import EmailVerificationToken, GoogleLoginCode, PasswordResetCode, User
from .serializers import InviteAcceptSerializer, LoginSerializer, PasswordResetConfirmSerializer, PasswordResetRequestSerializer, RegisterSerializer, VerifyEmailSerializer
from .serializers_profile import CurrentUserSerializer

logger = logging.getLogger(__name__)


def send_verification_email(user_email, code):
    default_from = getattr(settings, 'DEFAULT_FROM_EMAIL', 'onboarding@resend.dev').strip() or 'onboarding@resend.dev'
    if default_from.lower().endswith('@gmail.com'):
        default_from = 'onboarding@resend.dev'

    subject = 'Verify your Vendari email'
    html_content = f'''
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #0B1220; background: #f7f9fc; padding: 24px;">
    <div style="max-width: 560px; margin: 0 auto; background: white; border-radius: 12px; padding: 32px;">
        <h2 style="margin-top: 0;">Verify your email</h2>
        <p>Use the code below to complete your Vendari registration:</p>
        <div style="font-size: 32px; letter-spacing: 8px; font-weight: 700; padding: 18px 0; text-align: center; background: #eef3ff; border-radius: 8px; color: #1d4ed8;">{code}</div>
        <p>This code expires soon. If you did not create this account, you can ignore this email.</p>
    </div>
</body>
</html>
'''
    text_content = f'''Verify your Vendari email

Use the code below to complete your registration:

{code}

This code expires soon. If you did not create this account, you can ignore this email.
'''
    message = EmailMultiAlternatives(
        subject=subject,
        body=text_content,
        from_email=default_from,
        to=[user_email],
    )
    message.attach_alternative(html_content, 'text/html')
    return message.send(fail_silently=False)


def send_password_reset_email(user_email, code):
    from_email = getattr(settings, 'DEFAULT_FROM_EMAIL', 'onboarding@resend.dev').strip() or 'onboarding@resend.dev'
    subject = 'Reset your Vendari password'
    body = f'''We received a request to reset your Vendari password.

Your reset code is: {code}

This code expires in 10 minutes and can only be used once. If you did not request this, you can ignore this email.
'''
    html = f'''<div style="font-family:Arial,sans-serif;line-height:1.6;color:#0B1220;max-width:560px;margin:auto;padding:24px"><h2>Reset your Vendari password</h2><p>Use this code to choose a new password:</p><p style="font-size:32px;letter-spacing:8px;font-weight:700;padding:18px;text-align:center;background:#eef3ff;border-radius:8px;color:#1d4ed8">{code}</p><p>This code expires in 10 minutes and can only be used once. If you did not request this, you can ignore this email.</p></div>'''
    message = EmailMultiAlternatives(subject=subject, body=body, from_email=from_email, to=[user_email])
    message.attach_alternative(html, 'text/html')
    return message.send(fail_silently=False)


def token_pair(user):
    refresh = RefreshToken.for_user(user)
    return {'access': str(refresh.access_token), 'refresh': str(refresh)}


def send_welcome_email(user_email, business_name):
    """
    Send a welcome email immediately and log any failure without breaking registration.
    This avoids background-thread issues on managed hosts where the request worker can
    terminate before a daemon thread finishes.
    """
    logger.info(f'[WELCOME_EMAIL] Starting immediate send for user={user_email}, business={business_name}')
    try:
        from_email = getattr(settings, 'DEFAULT_FROM_EMAIL', '').strip() or 'onboarding@resend.dev'
        if from_email.lower().endswith('@gmail.com'):
            from_email = 'onboarding@resend.dev'
        logger.info(
            '[WELCOME_EMAIL] Configuration: from_email=%s, resend_api_key_set=%s, backend=%s',
            from_email,
            bool(getattr(settings, 'RESEND_API_KEY', '')),
            getattr(settings, 'EMAIL_BACKEND', ''),
        )

        if not getattr(settings, 'RESEND_API_KEY', ''):
            raise ValueError('RESEND_API_KEY is not configured.')

        dashboard_url = settings.DASHBOARD_URL
        subject = f'Welcome to Vendari, {business_name}'
        html_content = f'''
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <style>
        body {{ font-family: Inter, -apple-system, BlinkMacSystemFont, sans-serif; line-height: 1.6; color: #0B1220; }}
        .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
        .header {{ margin-bottom: 30px; }}
        .header h1 {{ font-size: 24px; font-weight: 600; color: #06122B; margin: 0 0 10px 0; }}
        .content {{ margin-bottom: 30px; color: #4B5768; }}
        .cta {{ display: inline-block; background: linear-gradient(135deg, #4683EC 0%, #4954F1 100%); color: white; text-decoration: none; padding: 12px 24px; border-radius: 8px; font-weight: 600; margin: 20px 0; }}
        .footer {{ font-size: 14px; color: #8792A2; border-top: 1px solid #E3E8F1; padding-top: 20px; }}
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Welcome to Vendari</h1>
        </div>
        <div class="content">
            <p>Hi there,</p>
            <p>Your {business_name} account is ready with a free 5-day trial of Vendari. Start recording sales and inventory right away — track what's low before it runs out, and see the real numbers about your business, computed live.</p>
            <p>Your trial lasts 5 days. After that, Vendari access pauses until you subscribe for ₦4,999 per month.</p>
            <a href="{dashboard_url}/dashboard" class="cta">Go to your dashboard</a>
            <p>Need help getting started? Reach out anytime — we're here to make this smooth for you.</p>
        </div>
        <div class="footer">
            <p>Vendari — track sales, inventory, and expenses. Made for business owners who want clarity, not complexity.</p>
        </div>
    </div>
</body>
</html>
'''
        text_content = f'''Welcome to Vendari

Hi there,

Your {business_name} account is ready with a free 5-day trial of Vendari. Start recording sales and inventory right away — track what's low before it runs out, and see the real numbers about your business, computed live.

Your trial lasts 5 days. After that, Vendari access pauses until you subscribe for ₦4,999 per month.

Go to your dashboard: {dashboard_url}/dashboard

Need help getting started? Reach out anytime — we're here to make this smooth for you.

Vendari — track sales, inventory, and expenses. Made for business owners who want clarity, not complexity.
'''

        logger.info(
            '[WELCOME_EMAIL] Creating EmailMultiAlternatives with from_email=%s, to=%s, subject=%s',
            from_email,
            user_email,
            subject[:50],
        )
        message = EmailMultiAlternatives(
            subject=subject,
            body=text_content,
            from_email=from_email,
            to=[user_email],
        )
        message.attach_alternative(html_content, 'text/html')

        logger.info('[WELCOME_EMAIL] Calling message.send() via %s...', settings.EMAIL_BACKEND)
        result = message.send(fail_silently=False)
        logger.info('[WELCOME_EMAIL] SUCCESS: message.send() returned %s for %s', result, user_email)
        return True
    except Exception:
        logger.exception('[WELCOME_EMAIL] EXCEPTION for %s', user_email)
        return False


def send_welcome_email_async(user_email, business_name):
    """Backward-compatible wrapper kept for callers that still prefer background execution."""
    logger.info('[WELCOME_EMAIL] Dispatching background thread for %s', user_email)
    thread = threading.Thread(target=send_welcome_email, args=(user_email, business_name), daemon=True)
    thread.start()


class RegisterView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        if rate_limited(request, 'auth-register', limit=5, window=900):
            return too_many_requests('Too many registration attempts. Please try again later.')
        serializer = RegisterSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()

        code = ''.join(str(random.randint(0, 9)) for _ in range(6))
        for _ in range(10):
            if not EmailVerificationToken.objects.filter(token=code).exists():
                break
            code = ''.join(str(random.randint(0, 9)) for _ in range(6))

        EmailVerificationToken.objects.update_or_create(
            user=user,
            defaults={'token': code},
        )
        send_verification_email(user.email, code)

        return Response(
            {
                'message': 'Registration successful. A 6-digit verification code has been sent to your email.',
                'email': user.email,
            },
            status=status.HTTP_201_CREATED,
        )


class VerifyEmailView(APIView):
    permission_classes = [AllowAny]

    @transaction.atomic
    def post(self, request):
        serializer = VerifyEmailSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        code = serializer.validated_data['code']
        email = serializer.validated_data.get('email')

        verification_qs = EmailVerificationToken.objects.select_for_update().select_related('user')
        if email:
            verification_qs = verification_qs.filter(user__email__iexact=email)
        verification = verification_qs.filter(token=code).first()
        if verification is None:
            return Response({'error': 'Invalid verification code.'}, status=status.HTTP_400_BAD_REQUEST)

        verification.user.is_verified = True
        verification.user.save(update_fields=['is_verified'])
        verification.delete()

        business = Business.objects.filter(owner=verification.user).first()
        if business:
            send_welcome_email(verification.user.email, business.name)

        return Response({'message': 'Email verified successfully.'})


class LoginView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        if rate_limited(request, 'auth-login', limit=10, window=300):
            return too_many_requests('Too many login attempts. Please try again later.')
        serializer = LoginSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        return Response(token_pair(serializer.validated_data['user']))


def google_redirect_uri():
    return settings.GOOGLE_REDIRECT_URI.strip()


def google_frontend_redirect_uri():
    return settings.GOOGLE_FRONTEND_REDIRECT_URI or f'{settings.DASHBOARD_URL.rstrip("/")}/login'


def google_error_redirect(message):
    return f'{google_frontend_redirect_uri()}?oauth_error={urllib.parse.quote(message)}'


class GoogleLoginStartView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        if not settings.GOOGLE_CLIENT_ID or not settings.GOOGLE_CLIENT_SECRET or not google_redirect_uri():
            return Response({'detail': 'Google sign-in is not configured on the server.'}, status=status.HTTP_503_SERVICE_UNAVAILABLE)
        state = TimestampSigner(salt='vendari-google-oauth').sign(secrets.token_urlsafe(24))
        params = urllib.parse.urlencode({
            'client_id': settings.GOOGLE_CLIENT_ID,
            'redirect_uri': google_redirect_uri(),
            'response_type': 'code',
            'scope': 'openid email profile',
            'state': state,
            'access_type': 'online',
            'prompt': 'select_account',
        })
        return redirect(f'https://accounts.google.com/o/oauth2/v2/auth?{params}')


class GoogleLoginCallbackView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        error = request.query_params.get('error')
        if error:
            return redirect(google_error_redirect('Google sign-in was cancelled.'))

        try:
            TimestampSigner(salt='vendari-google-oauth').unsign(request.query_params.get('state', ''), max_age=600)
        except (BadSignature, SignatureExpired):
            return redirect(google_error_redirect('Google sign-in expired. Please try again.'))

        authorization_code = request.query_params.get('code', '')
        if not authorization_code:
            return redirect(google_error_redirect('Google did not return an authorization code.'))

        try:
            token_request = urllib.request.Request(
                'https://oauth2.googleapis.com/token',
                data=urllib.parse.urlencode({
                    'code': authorization_code,
                    'client_id': settings.GOOGLE_CLIENT_ID,
                    'client_secret': settings.GOOGLE_CLIENT_SECRET,
                    'redirect_uri': google_redirect_uri(),
                    'grant_type': 'authorization_code',
                }).encode(),
                headers={'Content-Type': 'application/x-www-form-urlencoded'},
                method='POST',
            )
            with urllib.request.urlopen(token_request, timeout=15) as response:
                token_payload = json.loads(response.read())
            access_token = token_payload.get('access_token')
            if not access_token:
                raise ValueError('Google did not return an access token.')
            profile_request = urllib.request.Request(
                'https://openidconnect.googleapis.com/v1/userinfo',
                headers={'Authorization': f'Bearer {access_token}'},
            )
            with urllib.request.urlopen(profile_request, timeout=15) as response:
                profile = json.loads(response.read())
        except (urllib.error.HTTPError, urllib.error.URLError, ValueError, json.JSONDecodeError):
            logger.exception('Google OAuth exchange failed')
            return redirect(google_error_redirect('Google sign-in could not be completed.'))

        email = str(profile.get('email', '')).strip().lower()
        if not email or not profile.get('email_verified'):
            return redirect(google_error_redirect('Google did not provide a verified email address.'))

        user = User.objects.filter(email__iexact=email).first()
        if user is None:
            user = User(email=email, full_name=str(profile.get('name', '')).strip(), is_verified=True)
            user.set_unusable_password()
            user.save()
            plan, _ = Plan.objects.get_or_create(name=Plan.PLAN_PRO, interval=Plan.INTERVAL_MONTHLY, defaults={'amount': 4999})
            business_name = f"{user.full_name or email.split('@')[0]}'s business"
            business = Business.objects.create(owner=user, name=business_name, email=email, plan=plan, trial_started_at=timezone.now(), trial_ends_at=timezone.now() + timedelta(days=5))
            Membership.objects.create(user=user, business=business, role=Membership.ROLE_OWNER)
        elif not user.is_active:
            return redirect(google_error_redirect('This Vendari account is inactive.'))
        else:
            if not user.is_verified:
                user.is_verified = True
                user.save(update_fields=['is_verified'])

        code = secrets.token_urlsafe(48)
        GoogleLoginCode.objects.create(user=user, code=code, expires_at=timezone.now() + timedelta(minutes=2))
        return redirect(f'{google_frontend_redirect_uri()}?oauth_code={urllib.parse.quote(code)}')


class GoogleLoginExchangeView(APIView):
    permission_classes = [AllowAny]

    @transaction.atomic
    def post(self, request):
        code = str(request.data.get('code', '')).strip()
        login_code = GoogleLoginCode.objects.select_for_update().select_related('user').filter(code=code, used_at__isnull=True).first()
        if not code or login_code is None or login_code.expires_at <= timezone.now():
            return Response({'detail': 'This Google sign-in has expired. Please try again.'}, status=status.HTTP_400_BAD_REQUEST)
        login_code.used_at = timezone.now()
        login_code.save(update_fields=['used_at'])
        return Response(token_pair(login_code.user))


class PasswordResetRequestView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        generic_response = {'message': 'If an account matches that email, a password reset code has been sent.'}
        if rate_limited(request, 'password-reset-request', limit=3, window=900):
            return too_many_requests()
        serializer = PasswordResetRequestSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(generic_response, status=status.HTTP_200_OK)
        email = serializer.validated_data['email'].lower()
        if rate_limited(request, 'password-reset-request-email', limit=3, window=900, identifier=email):
            return Response(generic_response, status=status.HTTP_200_OK)
        user = User.objects.filter(email__iexact=email, is_active=True).first()
        if user is None:
            return Response(generic_response, status=status.HTTP_200_OK)
        code = f'{secrets.randbelow(100000000):08d}'
        PasswordResetCode.objects.update_or_create(
            user=user,
            defaults={
                'code_hash': make_password(code),
                'expires_at': timezone.now() + timedelta(minutes=10),
                'attempts': 0,
                'used_at': None,
            },
        )
        try:
            send_password_reset_email(user.email, code)
        except Exception:
            logger.exception('Password reset email failed for user=%s', user.pk)
        return Response(generic_response, status=status.HTTP_200_OK)


class PasswordResetConfirmView(APIView):
    permission_classes = [AllowAny]

    @transaction.atomic
    def post(self, request):
        serializer = PasswordResetConfirmSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        email = serializer.validated_data['email'].lower()
        reset = PasswordResetCode.objects.select_for_update().select_related('user').filter(user__email__iexact=email).first()
        invalid = {'detail': 'The reset code is invalid or expired.'}
        if reset is None or reset.used_at or reset.expires_at <= timezone.now() or reset.attempts >= 5:
            return Response(invalid, status=status.HTTP_400_BAD_REQUEST)
        if not check_password(serializer.validated_data['code'], reset.code_hash):
            reset.attempts += 1
            reset.save(update_fields=['attempts'])
            return Response(invalid, status=status.HTTP_400_BAD_REQUEST)
        user = reset.user
        user.set_password(serializer.validated_data['password'])
        user.save(update_fields=['password'])
        reset.used_at = timezone.now()
        reset.save(update_fields=['used_at'])
        return Response({'message': 'Your password has been reset. You can now log in.'})


class CurrentUserView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        return Response(CurrentUserSerializer(request.user).data)


class MarkWelcomeSeenView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        if not request.user.has_seen_welcome:
            request.user.has_seen_welcome = True
            request.user.save(update_fields=('has_seen_welcome',))
        return Response({'has_seen_welcome': True})


class AcceptInviteView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = InviteAcceptSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user, business, membership = serializer.save()
        tokens = token_pair(user)
        return Response(
            {'message': 'Invite accepted successfully.', 'business_id': business.id, 'role': membership.role, **tokens},
            status=status.HTTP_201_CREATED,
        )
