from django.conf import settings
from django.core.mail import send_mail
from django.db import transaction
from rest_framework import status
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken

from .models import EmailVerificationToken
from .serializers import InviteAcceptSerializer, LoginSerializer, RegisterSerializer, VerifyEmailSerializer


def token_pair(user):
    refresh = RefreshToken.for_user(user)
    return {'access': str(refresh.access_token), 'refresh': str(refresh)}


class RegisterView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = RegisterSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user, verification = serializer.save()
        send_mail(
            subject='Verify your Vendari email',
            message=f'Use this verification token to activate your account: {verification.token}',
            from_email=getattr(settings, 'DEFAULT_FROM_EMAIL', 'noreply@vendari.local'),
            recipient_list=[user.email],
        )
        return Response(
            {'message': 'Registration successful. Check your email to verify your account.', 'email': user.email},
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
