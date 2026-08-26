from rest_framework import status
from rest_framework.test import APITestCase

from accounts.models import User
from businesses.models import Business, Membership
from inventory.models import InventoryItem


class SalesApiTests(APITestCase):
    def setUp(self):
        self.user_a = User.objects.create_user('a@sales.local', 'password123')
        self.user_b = User.objects.create_user('b@sales.local', 'password123')
        self.business_a = Business.objects.create(owner=self.user_a, name='A')
        self.business_b = Business.objects.create(owner=self.user_b, name='B')
        Membership.objects.create(user=self.user_a, business=self.business_a, role='owner')
        Membership.objects.create(user=self.user_b, business=self.business_b, role='owner')
        self.item_a = InventoryItem.objects.create(
            business=self.business_a, product_name='Widget', qty_in_stock=5,
            reorder_level=1, cost_price='1.00', selling_price='2.00',
        )
        self.client.force_authenticate(self.user_a)
        self.url = f'/api/businesses/{self.business_a.pk}/sales/'

    def test_sale_decrements_stock(self):
        response = self.client.post(self.url, {'item': self.item_a.pk, 'quantity': 2, 'payment_method': 'cash'})
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['product_name'], 'Widget')
        self.assertEqual(response.data['unit_price'], '2.00')
        self.assertEqual(response.data['total'], '4.00')
        self.item_a.refresh_from_db()
        self.assertEqual(self.item_a.qty_in_stock, 3)

    def test_sale_rejects_oversell(self):
        response = self.client.post(self.url, {'item': self.item_a.pk, 'quantity': 6, 'payment_method': 'cash'})
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.item_a.refresh_from_db()
        self.assertEqual(self.item_a.qty_in_stock, 5)

    def test_business_a_cannot_read_or_write_business_b_sales(self):
        url = f'/api/businesses/{self.business_b.pk}/sales/'
        self.assertEqual(self.client.get(url).status_code, status.HTTP_403_FORBIDDEN)
        self.assertEqual(self.client.post(url, {'item': self.item_a.pk, 'quantity': 1, 'payment_method': 'cash'}).status_code, status.HTTP_403_FORBIDDEN)
