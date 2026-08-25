from rest_framework import status
from rest_framework.test import APITestCase

from accounts.models import User
from businesses.models import Business, Membership

from .models import Customer


class CustomerApiTests(APITestCase):
    def setUp(self):
        self.user_a = User.objects.create_user('a@customers.local', 'password123')
        self.user_b = User.objects.create_user('b@customers.local', 'password123')
        self.business_a = Business.objects.create(owner=self.user_a, name='A')
        self.business_b = Business.objects.create(owner=self.user_b, name='B')
        Membership.objects.create(user=self.user_a, business=self.business_a, role='owner')
        Membership.objects.create(user=self.user_b, business=self.business_b, role='owner')
        self.customer_b = Customer.objects.create(
            business=self.business_b, name='Business B Customer', phone='08000000000',
        )
        self.client.force_authenticate(self.user_a)

    def test_business_a_cannot_read_or_write_business_b_customers(self):
        url = f'/api/businesses/{self.business_b.pk}/customers/'
        self.assertEqual(self.client.get(url).status_code, status.HTTP_403_FORBIDDEN)
        response = self.client.post(url, {'name': 'Intruder', 'phone': '08111111111'})
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_business_a_cannot_access_business_b_customer_detail(self):
        url = f'/api/businesses/{self.business_b.pk}/customers/{self.customer_b.pk}/'
        self.assertEqual(self.client.get(url).status_code, status.HTTP_403_FORBIDDEN)
        self.assertEqual(self.client.patch(url, {'name': 'Changed'}).status_code, status.HTTP_403_FORBIDDEN)
        self.assertEqual(self.client.delete(url).status_code, status.HTTP_403_FORBIDDEN)

    def test_business_a_can_create_and_read_own_customer(self):
        url = f'/api/businesses/{self.business_a.pk}/customers/'
        response = self.client.post(url, {
            'name': 'Business A Customer', 'phone': '08012345678',
            'email': 'customer@example.com', 'address': 'A street', 'notes': 'Prefers calls',
        }, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['business'], self.business_a.pk)
        self.assertEqual(self.client.get(url).data[0]['name'], 'Business A Customer')
