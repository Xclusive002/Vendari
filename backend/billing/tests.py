import hashlib
import hmac
import json

from django.conf import settings
from rest_framework import status
from rest_framework.test import APITestCase

from accounts.models import User
from businesses.models import Business, Membership

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
        response = self.client.post(self.url, self.body, content_type='application/json', HTTP_X_PAYSTACK_SIGNATURE=self.signature)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        replay = self.client.post(self.url, self.body, content_type='application/json', HTTP_X_PAYSTACK_SIGNATURE=self.signature)
        self.assertEqual(replay.status_code, status.HTTP_200_OK)
        self.assertEqual(Subscription.objects.filter(paystack_reference='pay_test_123').count(), 1)
        self.assertEqual(Subscription.objects.get(business=self.business).plan, self.plan)
