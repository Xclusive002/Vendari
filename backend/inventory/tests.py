from django.urls import reverse
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
