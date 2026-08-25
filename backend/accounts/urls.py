from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView

from .views import AcceptInviteView, LoginView, RegisterView, ResendVerificationView, VerifyEmailView

urlpatterns = [
    path('register/', RegisterView.as_view(), name='auth-register'),
    path('resend-verification/', ResendVerificationView.as_view(), name='auth-resend-verification'),
    path('verify-email/', VerifyEmailView.as_view(), name='auth-verify-email'),
    path('login/', LoginView.as_view(), name='auth-login'),
    path('token/refresh/', TokenRefreshView.as_view(), name='auth-token-refresh'),
    path('accept-invite/', AcceptInviteView.as_view(), name='auth-accept-invite'),
]