import logging

from django.db import transaction
from rest_framework import status
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken

from .models import EmailVerificationToken
from .serializers import InviteAcceptSerializer, LoginSerializer, RegisterSerializer, VerifyEmailSerializer
from .serializers_profile import CurrentUserSerializer

logger = logging.getLogger(__name__)


def token_pair(user):
    refresh = RefreshToken.for_user(user)
    return {'access': str(refresh.access_token), 'refresh': str(refresh)}


class RegisterView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = RegisterSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
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
