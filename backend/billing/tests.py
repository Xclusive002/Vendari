import hashlib
import hmac
import json
from datetime import timedelta
from unittest.mock import patch

from django.conf import settings
from django.utils import timezone
from rest_framework import status
from rest_framework.test import APITestCase

from accounts.models import User
from businesses.models import Business, Membership, StorefrontOrder, StorefrontOrderLineItem, StorefrontSettings
from inventory.models import InventoryItem
from sales.models import Sale

from .models import Payment, Plan, Subscription, WebhookEvent


class PaystackInitializeTests(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user('initialize@test.local', 'password123')
        self.business = Business.objects.create(owner=self.user, name='Initialize Test')
        Membership.objects.create(user=self.user, business=self.business, role='owner')
        self.monthly = Plan.objects.create(name=Plan.PLAN_PRO, amount='4999.00', interval=Plan.INTERVAL_MONTHLY)
        self.yearly = Plan.objects.create(name=Plan.PLAN_PRO, amount='49999.00', interval=Plan.INTERVAL_YEARLY)
        self.client.force_authenticate(self.user)
        self.url = '/api/billing/paystack/initialize/'

    @patch('billing.views.paystack_request')
    def test_monthly_initialization_uses_4999_naira(self, paystack_request):
        paystack_request.return_value = {'status': True, 'data': {'authorization_url': 'https://paystack.test/monthly', 'reference': 'monthly-ref'}}

        response = self.client.post(self.url, {'business_id': self.business.pk, 'plan_id': self.monthly.pk, 'billing_interval': 'monthly'}, format='json')

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(paystack_request.call_args.args[0], 'transaction/initialize')
        self.assertEqual(paystack_request.call_args.args[1]['amount'], 499900)

    @patch('billing.views.paystack_request')
    def test_yearly_initialization_uses_49999_naira(self, paystack_request):
        paystack_request.return_value = {'status': True, 'data': {'authorization_url': 'https://paystack.test/yearly', 'reference': 'yearly-ref'}}

        response = self.client.post(self.url, {'business_id': self.business.pk, 'plan_id': self.yearly.pk, 'billing_interval': 'yearly'}, format='json')

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(paystack_request.call_args.args[0], 'transaction/initialize')
        self.assertEqual(paystack_request.call_args.args[1]['amount'], 4999900)


class PaystackMembershipCheckoutTests(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user('checkout@test.local', 'password123')
        self.client.force_authenticate(self.user)
        self.url = '/api/billing/checkout/'

    @patch('billing.views.paystack_request')
    def test_checkout_initializes_membership_plan_with_metadata(self, paystack_request):
        paystack_request.return_value = {'status': True, 'data': {'authorization_url': 'https://paystack.test/checkout', 'reference': 'checkout-ref'}}

        response = self.client.post(self.url, {'interval': 'monthly'}, format='json')

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(paystack_request.call_args.args[0], 'transaction/initialize')
        payload = paystack_request.call_args.args[1]
        self.assertEqual(payload['email'], self.user.email)
        self.assertEqual(payload['plan'], settings.PAYSTACK_MONTHLY_PLAN_CODE)
        self.assertEqual(payload['metadata']['type'], 'membership')
        self.assertEqual(payload['metadata']['user_id'], self.user.pk)
        self.assertEqual(payload['metadata']['interval'], 'monthly')
        self.assertIn('reference', payload)

    @patch('billing.views.paystack_request')
    def test_checkout_rejects_invalid_interval(self, paystack_request):
        response = self.client.post(self.url, {'interval': 'forever'}, format='json')

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        paystack_request.assert_not_called()

    @patch('billing.views.paystack_request')
    def test_yearly_checkout_uses_configured_kobo_price(self, paystack_request):
        paystack_request.return_value = {'status': True, 'data': {'authorization_url': 'https://paystack.test/yearly', 'reference': 'yearly-checkout-ref'}}

        response = self.client.post(self.url, {'interval': 'yearly'}, format='json')

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(settings.PRO_YEARLY_KOBO, 4999000)
        self.assertEqual(paystack_request.call_args.args[1]['amount'], 4999000)


class PaystackWebhookTests(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user('billing@test.local', 'password123')
        self.business = Business.objects.create(owner=self.user, name='Billing Test')
        Membership.objects.create(user=self.user, business=self.business, role='owner')
        self.plan = Plan.objects.create(name=Plan.PLAN_PRO, amount='1000.00')
        self.payload = {
            'event': 'charge.success',
            'data': {
                'reference': 'pay_test_123',
                'metadata': {'business_id': self.business.pk, 'plan_id': self.plan.pk},
            },
        }
        self.body = json.dumps(self.payload).encode()
        self.signature = hmac.new(settings.PAYSTACK_SECRET_KEY.encode(), self.body, hashlib.sha512).hexdigest()
        self.url = '/api/billing/paystack/webhook/'

    def test_webhook_rejects_missing_or_invalid_signature(self):
        self.assertEqual(self.client.post(self.url, self.body, content_type='application/json').status_code, status.HTTP_401_UNAUTHORIZED)
        response = self.client.post(self.url, self.body, content_type='application/json', HTTP_X_PAYSTACK_SIGNATURE='invalid')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    @patch('billing.views.paystack_request')
    def test_webhook_is_idempotent_for_replayed_payload(self, paystack_request):
        paystack_request.return_value = {
            'status': True,
            'data': {
                'reference': 'pay_test_123',
                'status': 'success',
                'amount': 100000,
                'fees': 0,
                'currency': 'NGN',
            },
        }
        before = timezone.now()
        response = self.client.post(self.url, self.body, content_type='application/json', HTTP_X_PAYSTACK_SIGNATURE=self.signature)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        replay = self.client.post(self.url, self.body, content_type='application/json', HTTP_X_PAYSTACK_SIGNATURE=self.signature)
        self.assertEqual(replay.status_code, status.HTTP_200_OK)
        self.assertEqual(Subscription.objects.filter(paystack_reference='pay_test_123').count(), 1)
        subscription = Subscription.objects.get(business=self.business)
        self.assertEqual(subscription.plan, self.plan)
        self.assertGreaterEqual(subscription.renews_at, before + timedelta(days=30) - timedelta(seconds=2))
        self.assertLessEqual(subscription.renews_at, timezone.now() + timedelta(days=30) + timedelta(seconds=2))
        paystack_request.assert_called_once()
        self.assertTrue(WebhookEvent.objects.get(reference='pay_test_123').processed_at)

    @patch('billing.views.paystack_request')
    def test_webhook_returns_accepted_while_another_delivery_holds_the_lease(self, paystack_request):
        event_id = hashlib.sha256('charge.success:pay_test_123'.encode()).hexdigest()
        WebhookEvent.objects.create(
            event='charge.success',
            event_id=event_id,
            reference='pay_test_123',
            processing_started_at=timezone.now(),
        )

        response = self.client.post(
            self.url,
            self.body,
            content_type='application/json',
            HTTP_X_PAYSTACK_SIGNATURE=self.signature,
        )

        self.assertEqual(response.status_code, status.HTTP_202_ACCEPTED)
        self.assertEqual(response.json()['status'], 'processing')
        paystack_request.assert_not_called()

    @patch('billing.views.paystack_request')
    def test_yearly_webhook_renews_for_365_days(self, paystack_request):
        paystack_request.return_value = {
            'status': True,
            'data': {
                'reference': 'pay_yearly_123',
                'status': 'success',
                'amount': 4999900,
                'fees': 0,
                'currency': 'NGN',
            },
        }
        yearly_plan = Plan.objects.create(name=Plan.PLAN_PRO, amount='49999.00', interval=Plan.INTERVAL_YEARLY)
        payload = {
            'event': 'charge.success',
            'data': {
                'reference': 'pay_yearly_123',
                'metadata': {'business_id': self.business.pk, 'plan_id': yearly_plan.pk, 'billing_interval': 'yearly'},
            },
        }
        body = json.dumps(payload).encode()
        signature = hmac.new(settings.PAYSTACK_SECRET_KEY.encode(), body, hashlib.sha512).hexdigest()
        before = timezone.now()

        response = self.client.post(self.url, body, content_type='application/json', HTTP_X_PAYSTACK_SIGNATURE=signature)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        subscription = Subscription.objects.get(business=self.business)
        self.assertEqual(subscription.plan, yearly_plan)
        self.assertGreaterEqual(subscription.renews_at, before + timedelta(days=365) - timedelta(seconds=2))
        self.assertLessEqual(subscription.renews_at, timezone.now() + timedelta(days=365) + timedelta(seconds=2))

    @patch('billing.views.paystack_request', return_value=None)
    def test_membership_webhook_does_not_trust_unverified_event_when_paystack_is_unavailable(self, paystack_request):
        response = self.client.post(self.url, self.body, content_type='application/json', HTTP_X_PAYSTACK_SIGNATURE=self.signature)

        self.assertEqual(response.status_code, status.HTTP_502_BAD_GATEWAY)
        self.assertFalse(Payment.objects.filter(reference='pay_test_123').exists())
        self.assertIsNone(WebhookEvent.objects.get(reference='pay_test_123').processed_at)
        paystack_request.assert_called_once()

    def test_storefront_payment_creates_snapshot_sale_once(self):
        storefront = StorefrontSettings.objects.create(
            business=self.business, slug='billingtest', is_published=True,
        )
        item = InventoryItem.objects.create(
            business=self.business, product_name='Rice', qty_in_stock=5,
            cost_price='10.00', selling_price='20.00', is_visible_on_storefront=True,
        )
        order = StorefrontOrder.objects.create(
            business=self.business, customer_name='Ada', customer_phone='0800',
            delivery_option='pickup', status=StorefrontOrder.STATUS_PENDING_PAYMENT,
            total='40.00', paystack_reference='store_pay_123',
        )
        StorefrontOrderLineItem.objects.create(order=order, inventory_item=item, quantity=2, unit_price='20.00')
        item.selling_price = '35.00'
        item.save(update_fields=['selling_price', 'updated_at'])
        payload = {
            'event': 'charge.success',
            'data': {
                'reference': 'store_pay_123',
                'status': 'success',
                'currency': 'NGN',
                'amount': 4000,
                'metadata': {'payment_type': 'storefront_order', 'storefront_order_id': order.pk, 'business_id': self.business.pk},
            },
        }
        body = json.dumps(payload).encode()
        signature = hmac.new(settings.PAYSTACK_SECRET_KEY.encode(), body, hashlib.sha512).hexdigest()

        response = self.client.post(self.url, body, content_type='application/json', HTTP_X_PAYSTACK_SIGNATURE=signature)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        order.refresh_from_db()
        item.refresh_from_db()
        sale = Sale.objects.get(business=self.business, item=item)
        self.assertEqual(order.status, StorefrontOrder.STATUS_PAID)
        self.assertEqual(sale.unit_price, 20)
        self.assertEqual(sale.total, 40)
        self.assertEqual(item.qty_in_stock, 3)

        replay = self.client.post(self.url, body, content_type='application/json', HTTP_X_PAYSTACK_SIGNATURE=signature)
        self.assertEqual(replay.status_code, status.HTTP_200_OK)
        self.assertEqual(Sale.objects.filter(business=self.business, item=item).count(), 1)
        item.refresh_from_db()
        self.assertEqual(item.qty_in_stock, 3)

    def test_storefront_payment_rejects_unverified_charge(self):
        storefront = StorefrontSettings.objects.create(
            business=self.business, slug='unverified-storefront', is_published=True,
        )
        item = InventoryItem.objects.create(
            business=self.business, product_name='Beans', qty_in_stock=5,
            cost_price='10.00', selling_price='20.00', is_visible_on_storefront=True,
        )
        order = StorefrontOrder.objects.create(
            business=self.business, customer_name='Ada', customer_phone='0800',
            delivery_option='pickup', status=StorefrontOrder.STATUS_PENDING_PAYMENT,
            total='20.00', paystack_reference='expected_reference',
        )
        StorefrontOrderLineItem.objects.create(order=order, inventory_item=item, quantity=1, unit_price='20.00')
        payload = {
            'event': 'charge.success',
            'data': {
                'reference': 'wrong_reference',
                'status': 'success',
                'currency': 'NGN',
                'amount': 2000,
                'metadata': {'payment_type': 'storefront_order', 'storefront_order_id': order.pk, 'business_id': self.business.pk},
            },
        }
        body = json.dumps(payload).encode()
        signature = hmac.new(settings.PAYSTACK_SECRET_KEY.encode(), body, hashlib.sha512).hexdigest()

        response = self.client.post(self.url, body, content_type='application/json', HTTP_X_PAYSTACK_SIGNATURE=signature)

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        order.refresh_from_db()
        item.refresh_from_db()
        self.assertEqual(order.status, StorefrontOrder.STATUS_PENDING_PAYMENT)
        self.assertEqual(item.qty_in_stock, 5)

    def test_non_membership_charge_success_is_ignored(self):
        payload = {
            'event': 'charge.success',
            'data': {
                'reference': 'invoice-ref-1',
                'status': 'success',
                'amount': 5000,
                'currency': 'NGN',
                'metadata': {'type': 'invoice', 'business_id': self.business.pk},
            },
        }
        body = json.dumps(payload).encode()
        signature = hmac.new(settings.PAYSTACK_SECRET_KEY.encode(), body, hashlib.sha512).hexdigest()

        response = self.client.post(self.url, body, content_type='application/json', HTTP_X_PAYSTACK_SIGNATURE=signature)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertFalse(Subscription.objects.filter(paystack_reference='invoice-ref-1').exists())
