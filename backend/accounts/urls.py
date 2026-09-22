from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView

from .views import AcceptInviteView, CurrentUserView, GoogleLoginCallbackView, GoogleLoginExchangeView, GoogleLoginStartView, LoginView, MarkWelcomeSeenView, PasswordResetConfirmView, PasswordResetRequestView, RegisterView, VerifyEmailView

urlpatterns = [
    path('register/', RegisterView.as_view(), name='auth-register'),
    path('verify-email/', VerifyEmailView.as_view(), name='auth-verify-email'),
    path('login/', LoginView.as_view(), name='auth-login'),
    path('google/start/', GoogleLoginStartView.as_view(), name='auth-google-start'),
    path('google/callback/', GoogleLoginCallbackView.as_view(), name='auth-google-callback'),
    path('google/exchange/', GoogleLoginExchangeView.as_view(), name='auth-google-exchange'),
    path('password-reset/request/', PasswordResetRequestView.as_view(), name='auth-password-reset-request'),
    path('password-reset/confirm/', PasswordResetConfirmView.as_view(), name='auth-password-reset-confirm'),
    path('me/', CurrentUserView.as_view(), name='auth-current-user'),
    path('mark-welcome-seen/', MarkWelcomeSeenView.as_view(), name='auth-mark-welcome-seen'),
    path('token/refresh/', TokenRefreshView.as_view(), name='auth-token-refresh'),
    path('accept-invite/', AcceptInviteView.as_view(), name='auth-accept-invite'),
]