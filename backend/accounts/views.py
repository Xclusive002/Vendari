import logging
import threading

from django.conf import settings
from django.core.mail import EmailMessage
from django.db import transaction
from rest_framework import status
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken

from businesses.models import Business
from .models import EmailVerificationToken
from .serializers import InviteAcceptSerializer, LoginSerializer, RegisterSerializer, VerifyEmailSerializer
from .serializers_profile import CurrentUserSerializer

logger = logging.getLogger(__name__)


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
        from_email = getattr(settings, 'DEFAULT_FROM_EMAIL', '').strip()
        logger.info(
            '[WELCOME_EMAIL] Configuration: from_email=%s, resend_api_key_set=%s, backend=%s',
            from_email,
            bool(getattr(settings, 'RESEND_API_KEY', '')),
            getattr(settings, 'EMAIL_BACKEND', ''),
        )

        if not from_email:
            raise ValueError('DEFAULT_FROM_EMAIL is not configured.')
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
            <p>Your {business_name} account is ready. Start recording sales and inventory right away — track what's low before it runs out, and see the real numbers about your business, computed live.</p>
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

Your {business_name} account is ready. Start recording sales and inventory right away — track what's low before it runs out, and see the real numbers about your business, computed live.

Go to your dashboard: {dashboard_url}/dashboard

Need help getting started? Reach out anytime — we're here to make this smooth for you.

Vendari — track sales, inventory, and expenses. Made for business owners who want clarity, not complexity.
'''

        logger.info(
            '[WELCOME_EMAIL] Creating EmailMessage with from_email=%s, to=%s, subject=%s',
            from_email,
            user_email,
            subject[:50],
        )
        message = EmailMessage(
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
        serializer = RegisterSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        
        # Get the business name for the welcome email
        business = Business.objects.filter(owner=user).first()
        if business:
            send_welcome_email(user.email, business.name)

        return Response(
            {
                'message': 'Registration successful. You can now sign in.',
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
        verification = EmailVerificationToken.objects.select_for_update().select_related('user').filter(
            token=serializer.validated_data['token'],
        ).first()
        if verification is None:
            return Response({'error': 'Invalid verification token.'}, status=status.HTTP_400_BAD_REQUEST)
        verification.user.is_verified = True
        verification.user.save(update_fields=['is_verified'])
        verification.delete()
        return Response({'message': 'Email verified successfully.'})


class LoginView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = LoginSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        return Response(token_pair(serializer.validated_data['user']))


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
        return Response(
            {'message': 'Invite accepted successfully.', 'business_id': business.id, 'role': membership.role},
            status=status.HTTP_201_CREATED,
        )
