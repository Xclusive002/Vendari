import urllib.error
from datetime import timedelta

from django.urls import reverse
from django.utils import timezone
from unittest.mock import patch
from rest_framework import status
from rest_framework.test import APITestCase

from accounts.models import User
from businesses.models import Business, Membership

from .models import InventoryItem


class InventoryApiTests(APITestCase):
    def setUp(self):
        self.user_a = User.objects.create_user('a@test.local', 'password123')
        self.user_b = User.objects.create_user('b@test.local', 'password123')
        self.business_a = Business.objects.create(owner=self.user_a, name='A')
        self.business_b = Business.objects.create(owner=self.user_b, name='B')
        Membership.objects.create(user=self.user_a, business=self.business_a, role='owner')
        Membership.objects.create(user=self.user_b, business=self.business_b, role='owner')
        self.business_a.trial_ends_at = timezone.now() + timedelta(days=5)
        self.business_a.save(update_fields=('trial_ends_at',))
        self.item_b = InventoryItem.objects.create(
            business=self.business_b, product_name='Hidden', qty_in_stock=5,
            reorder_level=1, cost_price='1.00', selling_price='2.00',
        )
        self.client.force_authenticate(self.user_a)

    def test_business_a_cannot_read_or_write_business_b_inventory(self):
        url = f'/api/businesses/{self.business_b.pk}/inventory/'
        self.assertEqual(self.client.get(url).status_code, status.HTTP_403_FORBIDDEN)
        response = self.client.post(url, {'product_name': 'Nope', 'qty_in_stock': 1, 'cost_price': '1.00', 'selling_price': '2.00'})
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    @patch('inventory.views.InventoryItemViewSet._meta_request')
    @patch('inventory.views.settings.WHATSAPP_BUSINESS_ACCOUNT_ID', 'waba-1')
    @patch('inventory.views.settings.WHATSAPP_ACCESS_TOKEN', 'token')
    def test_catalog_discovery_falls_back_to_owned_catalogs(self, meta_request):
        meta_request.side_effect = [
            urllib.error.HTTPError('https://graph.facebook.com', 400, 'unavailable', {}, None),
            {'data': [{'id': 'catalog-1', 'name': 'Main catalog', 'product_count': 1}]},
        ]

        response = self.client.get(f'/api/businesses/{self.business_a.pk}/inventory/meta-sync/')

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['catalogs'][0]['id'], 'catalog-1')
        self.assertEqual(meta_request.call_count, 2)

    @patch('inventory.views.InventoryItemViewSet._meta_request')
    @patch('inventory.views.settings.WHATSAPP_CATALOG_ID', 'catalog-1')
    @patch('inventory.views.settings.WHATSAPP_BUSINESS_ACCOUNT_ID', 'waba-1')
    @patch('inventory.views.settings.WHATSAPP_ACCESS_TOKEN', 'token')
    def test_configured_catalog_can_sync_when_catalog_listing_fails(self, meta_request):
        meta_request.side_effect = [
            urllib.error.HTTPError('https://graph.facebook.com', 400, 'unavailable', {}, None),
            urllib.error.HTTPError('https://graph.facebook.com', 400, 'unavailable', {}, None),
            {'data': [{'id': 'meta-product-1', 'name': 'Imported product', 'price': '12500', 'retailer_id': 'sku-1'}]},
        ]

        response = self.client.post(
            f'/api/businesses/{self.business_a.pk}/inventory/meta-sync/',
            {'catalog_id': 'catalog-1'},
            format='json',
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['imported'], 1)
        self.assertTrue(InventoryItem.objects.filter(business=self.business_a, code='sku-1').exists())
