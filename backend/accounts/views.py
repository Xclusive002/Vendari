import logging

from django.db import transaction
from rest_framework import status
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken

from .models import EmailVerificationToken, User
from utils.email import VerificationEmailError, send_verification_email as send_resend_verification_email
from .serializers import InviteAcceptSerializer, LoginSerializer, RegisterSerializer, VerifyEmailSerializer

logger = logging.getLogger(__name__)


def send_verification_email(user, verification):
    try:
        send_resend_verification_email(user.email, str(verification.token))
        return True
    except VerificationEmailError:
        return False


def token_pair(user):
    refresh = RefreshToken.for_user(user)
    return {'access': str(refresh.access_token), 'refresh': str(refresh)}


class RegisterView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = RegisterSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user, verification, was_resend = serializer.save()
        if not send_verification_email(user, verification):
            return Response(
                {'error': 'We could not send the verification email. Please try again.'},
                status=status.HTTP_503_SERVICE_UNAVAILABLE,
            )
        return Response(
            {
                'message': 'Verification email resent.' if was_resend else 'Registration successful. Check your email to verify your account.',
                'email': user.email,
            },
            status=status.HTTP_200_OK if was_resend else status.HTTP_201_CREATED,
        )


class ResendVerificationView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        email = request.data.get('email', '').strip().lower()
        user = User.objects.filter(email__iexact=email).first()
        if user is None or user.is_verified:
            return Response({'message': 'If that account needs verification, an email will be sent.'})

        verification = EmailVerificationToken.objects.filter(user=user).first()
        if verification:
            verification.delete()
        verification = EmailVerificationToken.objects.create(user=user)
        if not send_verification_email(user, verification):
            return Response(
                {'error': 'We could not send the verification email. Please try again.'},
                status=status.HTTP_503_SERVICE_UNAVAILABLE,
            )
        return Response({'message': 'Verification email resent.', 'email': user.email})


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
