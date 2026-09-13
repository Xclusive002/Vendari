import hashlib
import hmac
import json
from datetime import timedelta
from unittest.mock import patch

from django.utils import timezone
from rest_framework import status
from rest_framework.test import APITestCase

from businesses.models import Business, Membership
from customers.models import Customer
from inventory.models import InventoryItem

from .models import WhatsAppPendingAction


class WhatsAppWebhookTests(APITestCase):
    def setUp(self):
        from accounts.models import User
        from billing.models import Plan

        self.user = User.objects.create_user('whatsapp-owner@example.com', 'password123')
        self.plan = Plan.objects.create(name='pro', amount=9999, interval='monthly', feature_flags={
            'ai_insights': True,
            'nl_reporting': True,
            'forecasting': True,
            'voice_entry': True,
            'invoice_ai': True,
            'advanced_reports': True,
            'payments': True,
            'team_members': True,
        })
        self.business = Business.objects.create(
            owner=self.user,
            name='WhatsApp Shop',
            plan=self.plan,
            whatsapp_number='2348012345678',
            trial_ends_at=timezone.now() + timedelta(days=2),
        )
        Membership.objects.create(user=self.user, business=self.business, role=Membership.ROLE_OWNER)
        self.item = InventoryItem.objects.create(
            business=self.business,
            product_name='Cement',
            qty_in_stock=10,
            cost_price=2000,
            selling_price=2500,
        )

    def post_message(self, message, sender='2348012345678'):
        payload = {'entry': [{'changes': [{'value': {'messages': [{'from': sender, **message}]}}]}]}
        body = json.dumps(payload).encode()
        signature = hmac.new(b'test-app-secret', body, hashlib.sha256).hexdigest()
        with self.settings(WHATSAPP_APP_SECRET='test-app-secret'):
            return self.client.generic(
                'POST', '/api/whatsapp/webhook/', data=body,
                content_type='application/json', HTTP_X_HUB_SIGNATURE_256=f'sha256={signature}',
            )

    def test_meta_verification_handshake(self):
        with self.settings(WHATSAPP_WEBHOOK_VERIFY_TOKEN='verify-me'):
            response = self.client.get('/api/whatsapp/webhook/?hub.mode=subscribe&hub.verify_token=verify-me&hub.challenge=abc123')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.content, b'abc123')

    def test_invalid_signature_is_rejected(self):
        response = self.client.post('/api/whatsapp/webhook/', data='{}', content_type='application/json', HTTP_X_HUB_SIGNATURE_256='sha256=bad')
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    @patch('whatsapp.views.send_whatsapp_message')
    def test_unlinked_number_gets_setup_message(self, send_message):
        response = self.post_message({'type': 'text', 'text': {'body': 'hello'}}, sender='2348099999999')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['status'], 'unlinked')
        send_message.assert_called_once()
        self.assertIn('not linked', send_message.call_args.args[1])

    @patch('whatsapp.views.send_whatsapp_message')
    def test_expired_business_is_blocked_before_classification(self, send_message):
        self.business.trial_ends_at = timezone.now() - timedelta(minutes=1)
        self.business.save(update_fields=['trial_ends_at'])
        with patch('whatsapp.views.classify_message') as classify:
            response = self.post_message({'type': 'text', 'text': {'body': 'sold 2 cement'}})
        self.assertEqual(response.data['status'], 'subscription_required')
        classify.assert_not_called()
        self.assertIn('trial or subscription has ended', send_message.call_args.args[1])

    @patch('whatsapp.views.send_whatsapp_message')
    @patch('whatsapp.views.classify_message', return_value={
        'intent': 'sale', 'product': 'Cement', 'quantity': 2, 'payment_method': 'cash',
    })
    def test_sale_confirmation_decrements_stock(self, classify, send_message):
        first = self.post_message({'type': 'text', 'text': {'body': 'I sold two bags of cement for cash'}})
        self.assertEqual(first.data['status'], 'pending')
        self.assertTrue(WhatsAppPendingAction.objects.filter(business=self.business).exists())
        second = self.post_message({'type': 'text', 'text': {'body': 'YES'}})
        self.assertEqual(second.data['status'], 'confirmed')
        self.item.refresh_from_db()
        self.assertEqual(self.item.qty_in_stock, 8)
        self.assertEqual(self.business.sales.count(), 1)
        self.assertIn('Sale saved', send_message.call_args.args[1])

    @patch('whatsapp.views.send_whatsapp_message')
    @patch('whatsapp.views.classify_message', return_value={
        'intent': 'inventory', 'product': 'Cement', 'quantity': 5, 'cost_price': 2100,
    })
    def test_inventory_confirmation_restocks(self, classify, send_message):
        self.post_message({'type': 'text', 'text': {'body': 'restock five cement'}})
        self.post_message({'type': 'text', 'text': {'body': 'confirm'}})
        self.item.refresh_from_db()
        self.assertEqual(self.item.qty_in_stock, 15)
        self.assertEqual(self.item.cost_price, 2100)

    @patch('whatsapp.views.send_whatsapp_message')
    @patch('whatsapp.views.classify_message', return_value={
        'intent': 'customer', 'name': 'Ada', 'phone': '2348098765432', 'notes': 'Wholesale buyer',
    })
    def test_customer_confirmation_creates_customer(self, classify, send_message):
        self.post_message({'type': 'text', 'text': {'body': 'add customer Ada 08098765432'}})
        self.post_message({'type': 'text', 'text': {'body': 'yes'}})
        customer = Customer.objects.get(business=self.business, phone='2348098765432')
        self.assertEqual(customer.name, 'Ada')
        self.assertEqual(customer.notes, 'Wholesale buyer')

    @patch('whatsapp.views.send_whatsapp_message')
    @patch('whatsapp.views.classify_message', return_value={'intent': 'customer', 'name': 'Ada', 'phone': '2348098765432'})
    def test_new_message_replaces_pending_action(self, classify, send_message):
        self.post_message({'type': 'text', 'text': {'body': 'add Ada'}})
        self.post_message({'type': 'text', 'text': {'body': 'add Ada again'}})
        self.assertEqual(WhatsAppPendingAction.objects.filter(business=self.business, phone_number='2348012345678').count(), 1)
