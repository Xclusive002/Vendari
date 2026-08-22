from rest_framework import status
from rest_framework.test import APITestCase

from accounts.models import User
from businesses.models import Business, Membership


class ExpenseApiTests(APITestCase):
    def setUp(self):
        self.user_a = User.objects.create_user('a@expenses.local', 'password123')
        self.user_b = User.objects.create_user('b@expenses.local', 'password123')
        self.business_a = Business.objects.create(owner=self.user_a, name='A')
        self.business_b = Business.objects.create(owner=self.user_b, name='B')
        Membership.objects.create(user=self.user_a, business=self.business_a, role='owner')
        Membership.objects.create(user=self.user_b, business=self.business_b, role='owner')
        self.client.force_authenticate(self.user_a)

    def test_business_a_cannot_read_or_write_business_b_expenses(self):
        url = f'/api/businesses/{self.business_b.pk}/expenses/'
        self.assertEqual(self.client.get(url).status_code, status.HTTP_403_FORBIDDEN)
        response = self.client.post(url, {'date': '2026-08-22', 'category': 'rent', 'amount': '10.00', 'payment_method': 'cash'})
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
