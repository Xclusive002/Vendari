from datetime import timedelta
from decimal import Decimal
from unittest.mock import patch

from django.conf import settings
from django.core.cache import cache
from django.core.exceptions import ValidationError
from django.test import TestCase
from django.urls import reverse
from django.utils import timezone
from rest_framework.test import APIClient

from accounts.models import User
from billing.models import Payment, membership_payment_refunded, membership_payment_succeeded
from businesses.models import Business
from inventory.models import InventoryItem
from .fraud import refresh_referral_fraud_flags

from .models import Commission, Payout, PayoutAccount, Referral, ReferralCode, ReferralFraudFlag, get_balance


class ReferralModelTests(TestCase):
    def test_referral_code_uses_safe_characters_and_is_unique(self):
        referrer = User.objects.create_user('referrer@example.com', 'password123')

        code = ReferralCode.objects.create(user=referrer)

        self.assertEqual(len(code.code), 8)
        self.assertSetEqual(set(code.code), set(code.code))
        self.assertTrue(all(ch in 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789' for ch in code.code))
        self.assertNotIn('0', code.code)
        self.assertNotIn('O', code.code)
        self.assertNotIn('1', code.code)
        self.assertNotIn('I', code.code)

        with self.assertRaises(ValidationError):
            invalid = ReferralCode(user=referrer, code='BADCODE!')
            invalid.full_clean()

    def test_referral_tracks_referred_user_and_conversion(self):
        referrer = User.objects.create_user('referrer2@example.com', 'password123')
        referred_user = User.objects.create_user('referred@example.com', 'password123')
        code = ReferralCode.objects.create(user=referrer)

        referral = Referral.objects.create(
            referrer=referrer,
            referred_user=referred_user,
            code_used=code,
            status=Referral.STATUS_CONVERTED,
        )

        self.assertEqual(referral.referrer, referrer)
        self.assertEqual(referral.referred_user, referred_user)
        self.assertEqual(referral.code_used, code)
        self.assertEqual(referral.status, Referral.STATUS_CONVERTED)

    def test_required_defaults_and_fields_match_task_contract(self):
        self.assertEqual(settings.REFERRAL_SETTINGS['COMMISSION_WINDOW_MONTHS'], 12)
        self.assertEqual(settings.REFERRAL_SETTINGS['HOLD_DAYS'], 14)
        self.assertEqual(settings.REFERRAL_SETTINGS['MIN_PAYOUT_KOBO'], 500000)
        self.assertEqual(settings.REFERRAL_SETTINGS['REFERRED_TRIAL_DAYS'], 14)
        self.assertEqual(settings.REFERRAL_SETTINGS['CONCIERGE_COMMISSION_PERCENT'], 10)
        self.assertEqual(settings.REFERRAL_SETTINGS['CONCIERGE_HOLD_DAYS'], 14)
        self.assertEqual(settings.REFERRAL_SETTINGS['TRIAL_USAGE_CAPS']['ai_questions'], 50)
        self.assertEqual(settings.REFERRAL_SETTINGS['TRIAL_USAGE_CAPS']['voice_entries'], 20)
        self.assertEqual(settings.REFERRAL_SETTINGS['TRIAL_USAGE_CAPS']['whatsapp_messages'], 100)

        referral = Referral._meta.get_field('bonus_granted_at')
        self.assertTrue(referral.null)

        commission = Commission._meta.get_field('source')
        self.assertEqual(commission.default, Commission.SOURCE_MEMBERSHIP)

    def test_commission_and_payout_account_models_store_kobo_values(self):
        referrer = User.objects.create_user('referrer3@example.com', 'password123')
        referred_user = User.objects.create_user('referred3@example.com', 'password123')
        code = ReferralCode.objects.create(user=referrer)
        referral = Referral.objects.create(
            referrer=referrer,
            referred_user=referred_user,
            code_used=code,
            status=Referral.STATUS_CONVERTED,
        )

        commission = Commission.objects.create(
            referral=referral,
            referrer=referrer,
            payment_reference='ref-commission-123',
            gross_amount=500000,
            paystack_fee=25000,
            net_amount=475000,
            rate_percent=25,
            amount=475000,
            status=Commission.STATUS_PAID,
        )

        self.assertEqual(commission.gross_amount, 500000)
        self.assertEqual(commission.paystack_fee, 25000)
        self.assertEqual(commission.net_amount, 475000)
        self.assertEqual(commission.amount, 475000)

        payout_account = PayoutAccount.objects.create(
            user=referrer,
            bank_code='058',
            bank_name='Guaranty Trust Bank',
            account_number='0123456789',
            account_name='Jane Doe',
            paystack_recipient_code='RCP_123',
        )

        self.assertEqual(payout_account.bank_code, '058')
        self.assertEqual(payout_account.account_number, '0123456789')

        payout = Payout.objects.create(
            user=referrer,
            amount=475000,
            fee=0,
            status=Payout.STATUS_SUCCESS,
            paystack_transfer_code='TRF_123',
            reference='payout-ref-123',
        )

        self.assertEqual(payout.amount, 475000)
        self.assertEqual(payout.status, Payout.STATUS_SUCCESS)


class ReferralCommissionFlowTests(TestCase):
    def setUp(self):
        self.referrer = User.objects.create_user('commission-referrer@example.com', 'password123', full_name='Jane Doe')
        self.referral_code = ReferralCode.objects.create(user=self.referrer)

    def _create_referral(self, email='referred@example.com'):
        referred = User.objects.create_user(email, 'password123', full_name='Referred User')
        referral = Referral.objects.create(
            referrer=self.referrer,
            referred_user=referred,
            code_used=self.referral_code,
            status=Referral.STATUS_SIGNED_UP,
        )
        return referred, referral

    def _send_membership_payment(self, user, reference, amount='4999.00', fee='49.90', interval='monthly', paid_at=None):
        payment = Payment.objects.create(
            user=user,
            reference=reference,
            amount=Decimal(amount),
            fee=Decimal(fee),
            currency='NGN',
            interval=interval,
            status='paid',
            paid_at=paid_at or timezone.now(),
            metadata={'type': 'membership', 'interval': interval, 'user_id': user.pk},
        )
        membership_payment_succeeded.send(sender=Payment, payment=payment)
        return payment

    def test_first_conversion_and_monthly_renewal(self):
        referred, referral = self._create_referral('convert-1@example.com')

        self._send_membership_payment(referred, 'pay-001')
        referral.refresh_from_db()
        self.assertEqual(referral.status, Referral.STATUS_CONVERTED)
        self.assertIsNotNone(referral.first_paid_at)
        self.assertEqual(Commission.objects.filter(referral=referral).count(), 1)
        self.assertEqual(Commission.objects.get(referral=referral, payment_reference='pay-001').status, Commission.STATUS_PENDING)

        self._send_membership_payment(referred, 'pay-002', paid_at=referral.first_paid_at + timedelta(days=30))
        self.assertEqual(Commission.objects.filter(referral=referral).count(), 2)
        self.assertEqual(get_balance(self.referrer)['pending'], sum(c.amount for c in Commission.objects.filter(referral=referral)))

    def test_month_13_gives_no_commission_and_yearly_payer_gets_one(self):
        referred, referral = self._create_referral('convert-2@example.com')
        self._send_membership_payment(referred, 'pay-101', paid_at=timezone.now() - timedelta(days=400), interval='monthly')
        self.assertEqual(Commission.objects.filter(referral=referral).count(), 0)

        referred_yearly, yearly_referral = self._create_referral('convert-3@example.com')
        self._send_membership_payment(referred_yearly, 'pay-201', amount='49999.00', fee='499.99', interval='yearly')
        self.assertEqual(Commission.objects.filter(referral=yearly_referral).count(), 1)
        self._send_membership_payment(referred_yearly, 'pay-202', amount='49999.00', fee='499.99', interval='yearly', paid_at=timezone.now() + timedelta(days=10))
        self.assertEqual(Commission.objects.filter(referral=yearly_referral).count(), 1)

    def test_tier_changes_at_the_sixth_conversion(self):
        for index in range(5):
            referred, referral = self._create_referral(f'convert-{index}@example.com')
            self._send_membership_payment(referred, f'pay-tier-{index}')
            self.assertEqual(Commission.objects.filter(referral=referral).count(), 1)

        referred, referral = self._create_referral('convert-5@example.com')
        self._send_membership_payment(referred, 'pay-tier-5')
        self.assertEqual(Commission.objects.filter(referral=referral).count(), 1)
        self.assertEqual(Commission.objects.get(referral=referral, payment_reference='pay-tier-5').rate_percent, 25)

    def test_duplicate_signal_event_creates_single_commission(self):
        referred, referral = self._create_referral('duplicate@example.com')
        payment = self._send_membership_payment(referred, 'pay-dup')
        self.assertEqual(Commission.objects.filter(referral=referral).count(), 1)
        membership_payment_succeeded.send(sender=Payment, payment=payment)
        self.assertEqual(Commission.objects.filter(referral=referral).count(), 1)

    def test_refund_before_and_after_payout(self):
        referred, referral = self._create_referral('refund@example.com')
        payment = self._send_membership_payment(referred, 'pay-refund', paid_at=timezone.now() - timedelta(days=5))
        commission = Commission.objects.get(referral=referral)
        self.assertEqual(commission.status, Commission.STATUS_PENDING)

        membership_payment_refunded.send(sender=Payment, payment=payment)
        commission.refresh_from_db()
        self.assertEqual(commission.status, Commission.STATUS_REVERSED)

        payment2 = self._send_membership_payment(referred, 'pay-refund-2', paid_at=timezone.now() + timedelta(days=5))
        commission2 = Commission.objects.get(referral=referral, payment_reference='pay-refund-2')
        self.assertEqual(commission2.status, Commission.STATUS_PENDING)
        commission2.status = Commission.STATUS_PAID
        commission2.save(update_fields=['status'])
        membership_payment_refunded.send(sender=Payment, payment=payment2)
        adjustment = Commission.objects.filter(referral=referral, payment_reference='pay-refund-2-refund').first()
        self.assertIsNotNone(adjustment)
        self.assertLess(adjustment.amount, 0)
        self.assertEqual(get_balance(self.referrer)['approved'], 0)


class ReferralWithdrawalFlowTests(TestCase):
    def setUp(self):
        cache.clear()
        self.user = User.objects.create_user('withdrawer@example.com', 'password123', full_name='Jane Doe')
        self.client = APIClient()
        self.client.force_authenticate(user=self.user)

    @patch('referrals.views.paystack_request')
    def test_payout_account_creation_and_successful_withdrawal(self, mock_paystack):
        mock_paystack.side_effect = [
            {'status': True, 'data': {'account_name': 'Jane Doe'}},
            {'status': True, 'data': {'recipient_code': 'RCP_123'}},
            {'status': True, 'data': {'transfer_code': 'TRF_123', 'reference': 'pay_ref_123'}},
        ]

        account_response = self.client.post('/api/referrals/payout-account/', {
            'bank_code': '058',
            'account_number': '0123456789',
        }, format='json')
        self.assertEqual(account_response.status_code, 200)
        self.assertEqual(account_response.json()['account_name'], 'Jane Doe')

        account = PayoutAccount.objects.get(user=self.user)
        self.assertEqual(account.paystack_recipient_code, 'RCP_123')

        Commission.objects.create(
            referral=Referral.objects.create(
                referrer=self.user,
                referred_user=User.objects.create_user('referred-1@example.com', 'password123', full_name='Referred One'),
                code_used=ReferralCode.objects.create(user=self.user),
                status=Referral.STATUS_CONVERTED,
            ),
            referrer=self.user,
            source=Commission.SOURCE_MEMBERSHIP,
            payment_reference='pay-ref-001',
            gross_amount=1000000,
            paystack_fee=50000,
            net_amount=950000,
            rate_percent=20,
            amount=950000,
            status=Commission.STATUS_APPROVED,
        )

        withdraw_response = self.client.post('/api/referrals/withdraw/', {
            'amount': 500000,
            'idempotency_key': 'withdraw-once',
        }, format='json')
        self.assertEqual(withdraw_response.status_code, 200)
        self.assertEqual(Payout.objects.filter(user=self.user).count(), 1)
        self.assertEqual(Payout.objects.get(user=self.user).status, Payout.STATUS_PROCESSING)
        replay = self.client.post('/api/referrals/withdraw/', {
            'amount': 500000,
            'idempotency_key': 'withdraw-once',
        }, format='json')
        self.assertEqual(replay.status_code, 200)
        self.assertTrue(replay.json()['idempotent_replay'])
        self.assertEqual(Payout.objects.filter(user=self.user).count(), 1)
        self.assertEqual(mock_paystack.call_count, 3)

    @patch('referrals.views.paystack_request')
    def test_failed_transfer_marks_payout_failed(self, mock_paystack):
        mock_paystack.side_effect = [
            {'status': True, 'data': {'account_name': 'Jane Doe'}},
            {'status': True, 'data': {'recipient_code': 'RCP_456'}},
            {'status': False, 'message': 'insufficient balance'},
        ]

        self.client.post('/api/referrals/payout-account/', {'bank_code': '058', 'account_number': '0123456789'}, format='json')
        Commission.objects.create(
            referral=Referral.objects.create(
                referrer=self.user,
                referred_user=User.objects.create_user('referred-2@example.com', 'password123', full_name='Referred Two'),
                code_used=ReferralCode.objects.create(user=self.user),
                status=Referral.STATUS_CONVERTED,
            ),
            referrer=self.user,
            source=Commission.SOURCE_MEMBERSHIP,
            payment_reference='pay-ref-002',
            gross_amount=1000000,
            paystack_fee=50000,
            net_amount=950000,
            rate_percent=20,
            amount=950000,
            status=Commission.STATUS_APPROVED,
        )

        response = self.client.post('/api/referrals/withdraw/', {'amount': 950000}, format='json')
        self.assertEqual(response.status_code, 400)
        self.assertEqual(Payout.objects.filter(user=self.user, status=Payout.STATUS_FAILED).count(), 1)

    @patch('referrals.views.paystack_request')
    def test_transfer_reversal_returns_commissions_to_approved_balance(self, mock_paystack):
        mock_paystack.side_effect = [
            {'status': True, 'data': {'account_name': 'Jane Doe'}},
            {'status': True, 'data': {'recipient_code': 'RCP_789'}},
            {'status': True, 'data': {'transfer_code': 'TRF_789', 'reference': 'pay_ref_789'}},
        ]

        self.client.post('/api/referrals/payout-account/', {'bank_code': '058', 'account_number': '0123456789'}, format='json')
        commission = Commission.objects.create(
            referral=Referral.objects.create(
                referrer=self.user,
                referred_user=User.objects.create_user('referred-3@example.com', 'password123', full_name='Referred Three'),
                code_used=ReferralCode.objects.create(user=self.user),
                status=Referral.STATUS_CONVERTED,
            ),
            referrer=self.user,
            source=Commission.SOURCE_MEMBERSHIP,
            payment_reference='pay-ref-003',
            gross_amount=600000,
            paystack_fee=30000,
            net_amount=570000,
            rate_percent=20,
            amount=570000,
            status=Commission.STATUS_APPROVED,
        )
        withdraw_response = self.client.post('/api/referrals/withdraw/', {'amount': 570000}, format='json')
        self.assertEqual(withdraw_response.status_code, 200)
        payout = Payout.objects.get(user=self.user)
        payout.status = Payout.STATUS_SUCCESS
        payout.completed_at = timezone.now()
        payout.save(update_fields=['status', 'completed_at'])
        payout.covered_commissions.add(commission)
        commission.status = Commission.STATUS_PAID
        commission.save(update_fields=['status'])

        payout.status = Payout.STATUS_REVERSED
        payout.completed_at = timezone.now()
        payout.save(update_fields=['status', 'completed_at'])
        commission.status = Commission.STATUS_APPROVED
        commission.save(update_fields=['status'])
        self.assertEqual(commission.status, Commission.STATUS_APPROVED)

    def test_insufficient_balance_is_rejected(self):
        response = self.client.post('/api/referrals/withdraw/', {'amount': 50000}, format='json')
        self.assertEqual(response.status_code, 400)

    @patch('referrals.views.paystack_request')
    def test_bank_change_requires_password_and_locks_withdrawals_for_24_hours(self, mock_paystack):
        PayoutAccount.objects.create(
            user=self.user,
            bank_code='058',
            bank_name='Old Bank',
            account_number='0123456789',
            account_name='Jane Doe',
            paystack_recipient_code='RCP_OLD',
        )
        changed_account = {
            'bank_code': '011',
            'account_number': '9876543210',
        }

        unauthorized = self.client.post('/api/referrals/payout-account/', changed_account, format='json')
        self.assertEqual(unauthorized.status_code, 400)
        mock_paystack.assert_not_called()

        mock_paystack.side_effect = [
            {'status': True, 'data': {'account_name': 'Jane Doe', 'bank_name': 'New Bank'}},
            {'status': True, 'data': {'recipient_code': 'RCP_NEW'}},
        ]
        response = self.client.post(
            '/api/referrals/payout-account/',
            {**changed_account, 'password': 'password123'},
            format='json',
        )
        self.assertEqual(response.status_code, 200)
        account = PayoutAccount.objects.get(user=self.user)
        self.assertGreaterEqual(account.withdrawal_locked_until, timezone.now() + timedelta(hours=23, minutes=59))

        withdrawal = self.client.post('/api/referrals/withdraw/', {'amount': 500000}, format='json')
        self.assertEqual(withdrawal.status_code, 423)
        self.assertIn('24 hours', withdrawal.json()['detail'])

    @patch('referrals.views.paystack_request', return_value=None)
    def test_unknown_transfer_result_remains_processing_and_is_not_retried(self, mock_paystack):
        PayoutAccount.objects.create(
            user=self.user,
            bank_code='058',
            bank_name='Bank',
            account_number='0123456789',
            account_name='Jane Doe',
            paystack_recipient_code='RCP_UNKNOWN',
        )
        Commission.objects.create(
            referral=Referral.objects.create(
                referrer=self.user,
                referred_user=User.objects.create_user('unknown-transfer@example.com', 'password123'),
                code_used=ReferralCode.objects.create(user=self.user),
                status=Referral.STATUS_CONVERTED,
            ),
            referrer=self.user,
            payment_reference='pay-ref-unknown',
            amount=600000,
            status=Commission.STATUS_APPROVED,
        )

        response = self.client.post('/api/referrals/withdraw/', {
            'amount': 500000,
            'idempotency_key': 'unknown-transfer',
        }, format='json')
        self.assertEqual(response.status_code, 502)
        payout = Payout.objects.get(idempotency_key='unknown-transfer')
        self.assertEqual(payout.status, Payout.STATUS_PROCESSING)

        replay = self.client.post('/api/referrals/withdraw/', {
            'amount': 500000,
            'idempotency_key': 'unknown-transfer',
        }, format='json')
        self.assertEqual(replay.status_code, 200)
        self.assertTrue(replay.json()['idempotent_replay'])
        mock_paystack.assert_called_once()

    def test_withdrawal_endpoint_is_rate_limited(self):
        responses = [
            self.client.post('/api/referrals/withdraw/', {'amount': 1}, format='json')
            for _ in range(4)
        ]
        self.assertEqual([response.status_code for response in responses], [400, 400, 400, 429])

    @patch('referrals.views.paystack_request')
    def test_concurrent_withdrawals_are_blocked(self, mock_paystack):
        mock_paystack.side_effect = [
            {'status': True, 'data': {'account_name': 'Jane Doe'}},
            {'status': True, 'data': {'recipient_code': 'RCP_999'}},
            {'status': True, 'data': {'transfer_code': 'TRF_998', 'reference': 'pay_ref_998'}},
        ]

        self.client.post('/api/referrals/payout-account/', {'bank_code': '058', 'account_number': '0123456789'}, format='json')
        Commission.objects.create(
            referral=Referral.objects.create(
                referrer=self.user,
                referred_user=User.objects.create_user('referred-4@example.com', 'password123', full_name='Referred Four'),
                code_used=ReferralCode.objects.create(user=self.user),
                status=Referral.STATUS_CONVERTED,
            ),
            referrer=self.user,
            source=Commission.SOURCE_MEMBERSHIP,
            payment_reference='pay-ref-004',
            gross_amount=1000000,
            paystack_fee=50000,
            net_amount=950000,
            rate_percent=20,
            amount=950000,
            status=Commission.STATUS_APPROVED,
        )

        first = self.client.post('/api/referrals/withdraw/', {'amount': 950000}, format='json')
        second = self.client.post('/api/referrals/withdraw/', {'amount': 950000}, format='json')
        self.assertEqual(first.status_code, 200)
        self.assertEqual(second.status_code, 409)


class ReferralDashboardEndpointTests(TestCase):
    def setUp(self):
        self.user = User.objects.create_user('dashboard-referrer@example.com', 'password123', full_name='Dashboard Referrer')
        self.client = APIClient()
        self.client.force_authenticate(user=self.user)
        self.code = ReferralCode.objects.create(user=self.user)

    def test_dashboard_me_and_listing_endpoints(self):
        referred = User.objects.create_user('referred-dashboard@example.com', 'password123', full_name='Adewale Bello')
        referral = Referral.objects.create(
            referrer=self.user,
            referred_user=referred,
            code_used=self.code,
            status=Referral.STATUS_CONVERTED,
            first_paid_at=timezone.now(),
        )
        Commission.objects.create(
            referral=referral,
            referrer=self.user,
            source=Commission.SOURCE_MEMBERSHIP,
            payment_reference='dashboard-commission-1',
            gross_amount=500000,
            paystack_fee=25000,
            net_amount=475000,
            rate_percent=20,
            amount=475000,
            status=Commission.STATUS_APPROVED,
        )
        Commission.objects.create(
            referral=referral,
            referrer=self.user,
            source=Commission.SOURCE_MEMBERSHIP,
            payment_reference='dashboard-commission-reversed',
            gross_amount=100000,
            amount=10000,
            status=Commission.STATUS_REVERSED,
        )
        Payout.objects.create(
            user=self.user,
            amount=250000,
            fee=0,
            status=Payout.STATUS_SUCCESS,
            paystack_transfer_code='TRF_DASHBOARD',
            reference='dashboard-payout-1',
        )
        Payout.objects.create(
            user=self.user,
            amount=100000,
            fee=0,
            status=Payout.STATUS_PROCESSING,
            paystack_transfer_code='TRF_DASHBOARD_PROCESSING',
            reference='dashboard-payout-processing',
            idempotency_key='dashboard-payout-processing',
        )

        with self.settings(FRONTEND_URL='https://frontend.example/'):
            me_response = self.client.get('/api/referrals/me/')
        self.assertEqual(me_response.status_code, 200)
        payload = me_response.json()
        self.assertEqual(payload['referral_code'], self.code.code)
        self.assertEqual(payload['share_link'], f'https://frontend.example/register?ref={self.code.code}')
        self.assertEqual(payload['minimum_payout'], settings.REFERRAL_SETTINGS['MIN_PAYOUT_KOBO'])
        self.assertIn('counts', payload)
        self.assertIn('balance', payload)
        self.assertEqual(payload['balance']['approved'], 475000)
        self.assertEqual(payload['balance']['available'], 375000)

        referrals_response = self.client.get('/api/referrals/referrals/')
        self.assertEqual(referrals_response.status_code, 200)
        referrals_payload = referrals_response.json()
        self.assertGreater(referrals_payload['count'], 0)
        self.assertEqual(referrals_payload['count'], 1)
        self.assertNotIn('referred_email', referrals_payload['results'][0])
        self.assertEqual(referrals_payload['results'][0]['status'], 'Paid')
        self.assertIn('Ade***', referrals_payload['results'][0]['referred_name'])
        self.assertEqual(referrals_payload['results'][0]['commission_earned'], 475000)

        commissions_response = self.client.get('/api/referrals/commissions/?status=APPROVED')
        self.assertEqual(commissions_response.status_code, 200)
        commissions_payload = commissions_response.json()
        self.assertEqual(commissions_payload['results'][0]['source'], 'Membership')

        payouts_response = self.client.get('/api/referrals/payouts/?status=SUCCESS')
        self.assertEqual(payouts_response.status_code, 200)
        payouts_payload = payouts_response.json()
        self.assertEqual(payouts_payload['results'][0]['status'], 'Success')

    def test_dashboard_counts_only_active_trials_and_masks_referred_details(self):
        trial_user = User.objects.create_user('trial-dashboard@example.com', 'password123', full_name='Trial Member')
        expired_user = User.objects.create_user('expired-dashboard@example.com', 'password123', full_name='Expired Member')
        Referral.objects.create(
            referrer=self.user,
            referred_user=trial_user,
            code_used=self.code,
            status=Referral.STATUS_SIGNED_UP,
        )
        expired_referral = Referral.objects.create(
            referrer=self.user,
            referred_user=expired_user,
            code_used=self.code,
            status=Referral.STATUS_SIGNED_UP,
        )
        Referral.objects.filter(pk=expired_referral.pk).update(
            created_at=timezone.now() - timedelta(days=settings.REFERRAL_SETTINGS['REFERRED_TRIAL_DAYS'] + 1)
        )

        me_response = self.client.get('/api/referrals/me/')
        self.assertEqual(me_response.status_code, 200)
        self.assertEqual(me_response.json()['counts']['signups'], 2)
        self.assertEqual(me_response.json()['counts']['trials'], 1)

        referrals_response = self.client.get('/api/referrals/referrals/')
        self.assertEqual(referrals_response.status_code, 200)
        rows_by_name = {row['referred_name']: row for row in referrals_response.json()['results']}
        self.assertEqual(rows_by_name['Tri***']['status'], 'Trial')
        self.assertEqual(rows_by_name['Exp***']['status'], 'Expired')
        self.assertTrue(all('referred_email' not in row for row in rows_by_name.values()))


class ReferralSignupFlowTests(TestCase):
    def setUp(self):
        cache.clear()
        self.referrer = User.objects.create_user('referrer@example.com', 'password123', full_name='Jane Doe')
        self.referral_code = ReferralCode.objects.create(user=self.referrer)

    def test_public_validation_endpoint_for_valid_and_invalid_code(self):
        valid_response = self.client.get(reverse('referral-validate', args=[self.referral_code.code]))
        self.assertEqual(valid_response.status_code, 200)
        self.assertEqual(valid_response.json(), {'valid': True, 'referrer_first_name': 'Jane'})

        invalid_response = self.client.get(reverse('referral-validate', args=['INVALID99']))
        self.assertEqual(invalid_response.status_code, 200)
        self.assertEqual(invalid_response.json(), {'valid': False, 'referrer_first_name': ''})

    def test_shared_device_signups_are_tracked_for_fraud_review(self):
        other_user = User.objects.create_user('other-referrer@example.com', 'password123', full_name='Other Referrer')
        other_code = ReferralCode.objects.create(user=other_user)
        Referral.objects.create(
            referrer=other_user,
            referred_user=self.referrer,
            code_used=other_code,
            status=Referral.STATUS_SIGNED_UP,
            signup_device_hash='shared-device-hash',
        )

        for email in ('shared-device-user@example.com', 'another-shared-device-user@example.com'):
            response = self.client.post('/api/auth/register/', {
                'email': email,
                'password': 'StrongPass123',
                'business_name': 'Shared Device Business',
                'full_name': 'Shared Device User',
                'referral_code': other_code.code,
                'signup_device_hash': 'shared-device-hash',
            }, content_type='application/json')
            self.assertEqual(response.status_code, 201)
            referred = User.objects.get(email=email)
            self.assertTrue(Referral.objects.filter(referrer=other_user, referred_user=referred).exists())

        self.assertTrue(ReferralFraudFlag.objects.filter(
            referrer=other_user,
            code='shared_signup_device',
            resolved_at__isnull=True,
        ).exists())
        business = Business.objects.get(owner=User.objects.get(email='shared-device-user@example.com'))
        trial_length = business.trial_ends_at - business.trial_started_at
        self.assertEqual(trial_length.days, 14)

    def test_valid_referral_creates_signup_record_and_14_day_trial(self):
        response = self.client.post('/api/auth/register/', {
            'email': 'newuser@example.com',
            'password': 'StrongPass123',
            'business_name': 'Referred Business',
            'full_name': 'New User',
            'referral_code': self.referral_code.code,
        }, content_type='application/json')

        self.assertEqual(response.status_code, 201)
        referred_user = User.objects.get(email='newuser@example.com')
        referral = Referral.objects.get(referred_user=referred_user)
        self.assertEqual(referral.referrer, self.referrer)
        self.assertEqual(referral.status, Referral.STATUS_SIGNED_UP)

        business = Business.objects.get(owner=referred_user)
        trial_length = business.trial_ends_at - business.trial_started_at
        self.assertEqual(trial_length.days, 14)

    def test_referral_code_can_be_used_for_multiple_distinct_referrals(self):
        self.client.post('/api/auth/register/', {
            'email': 'firstreferral@example.com',
            'password': 'StrongPass123',
            'business_name': 'First Business',
            'full_name': 'First User',
            'referral_code': self.referral_code.code,
        }, content_type='application/json')

        response = self.client.post('/api/auth/register/', {
            'email': 'secondreferral@example.com',
            'password': 'StrongPass123',
            'business_name': 'Second Business',
            'full_name': 'Second User',
            'referral_code': self.referral_code.code,
        }, content_type='application/json')

        self.assertEqual(response.status_code, 201)
        self.assertEqual(Referral.objects.filter(referrer=self.referrer).count(), 2)
        self.assertEqual(Referral.objects.filter(code_used=self.referral_code).count(), 2)
        validation = self.client.get(reverse('referral-validate', args=[self.referral_code.code]))
        self.assertEqual(validation.status_code, 200)
        self.assertTrue(validation.json()['valid'])

        second_business = Business.objects.get(owner=User.objects.get(email='secondreferral@example.com'))
        self.assertEqual((second_business.trial_ends_at - second_business.trial_started_at).days, 14)

    def test_inventory_activity_prevents_unused_trial_flag(self):
        referred = User.objects.create_user(
            'active-trial@example.com',
            'password123',
            full_name='Active Trial',
            is_verified=True,
        )
        referral = Referral.objects.create(
            referrer=self.referrer,
            referred_user=referred,
            code_used=self.referral_code,
        )
        Referral.objects.filter(pk=referral.pk).update(
            created_at=timezone.now() - timedelta(days=settings.REFERRAL_SETTINGS['REFERRED_TRIAL_DAYS'] + 1)
        )
        business = Business.objects.create(owner=referred, name='Trial Business')
        InventoryItem.objects.create(
            business=business,
            product_name='Product',
            qty_in_stock=1,
            cost_price='1.00',
            selling_price='2.00',
        )

        with self.settings(FRAUD_INACTIVE_TRIAL_THRESHOLD=1):
            refresh_referral_fraud_flags(self.referrer)

        self.assertFalse(ReferralFraudFlag.objects.filter(
            referrer=self.referrer,
            code='unused_trial_accounts',
            resolved_at__isnull=True,
        ).exists())
