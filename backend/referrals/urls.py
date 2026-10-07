from django.urls import path

from .views import (
    ReferralBanksView,
    ReferralCommissionListView,
    ReferralDashboardMeView,
    ReferralListView,
    ReferralPayoutAccountView,
    ReferralPayoutListView,
    ReferralValidateView,
    ReferralWithdrawView,
)

urlpatterns = [
    path('me/', ReferralDashboardMeView.as_view(), name='referral-me'),
    path('referrals/', ReferralListView.as_view(), name='referral-list'),
    path('commissions/', ReferralCommissionListView.as_view(), name='referral-commissions'),
    path('payouts/', ReferralPayoutListView.as_view(), name='referral-payouts'),
    path('validate/<str:code>/', ReferralValidateView.as_view(), name='referral-validate'),
    path('banks/', ReferralBanksView.as_view(), name='referral-banks'),
    path('payout-account/', ReferralPayoutAccountView.as_view(), name='referral-payout-account'),
    path('withdraw/', ReferralWithdrawView.as_view(), name='referral-withdraw'),
]
