import hashlib
import hmac
import json
from datetime import timedelta

from django.conf import settings
from django.utils import timezone
from rest_framework import status
from rest_framework.test import APITestCase

from accounts.models import User
from businesses.models import Business, Membership, StorefrontOrder, StorefrontOrderLineItem, StorefrontSettings
from inventory.models import InventoryItem
from sales.models import Sale

from .models import Plan, Subscription


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

    def test_webhook_is_idempotent_for_replayed_payload(self):
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

    def test_yearly_webhook_renews_for_365_days(self):
        yearly_plan = Plan.objects.create(name=Plan.PLAN_PRO, amount='99999.00', interval=Plan.INTERVAL_YEARLY)
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
