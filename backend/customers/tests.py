from datetime import timedelta
from decimal import Decimal
from unittest.mock import patch

from django.test import override_settings
from django.utils import timezone
from rest_framework import status
from rest_framework.test import APITestCase

from accounts.models import User
from businesses.models import Business, Membership
from invoices.models import Invoice
from sales.models import Sale

from .models import Customer, CustomerReminder


class CustomerApiTests(APITestCase):
    def setUp(self):
        self.user_a = User.objects.create_user('a@customers.local', 'password123')
        self.user_b = User.objects.create_user('b@customers.local', 'password123')
        self.business_a = Business.objects.create(owner=self.user_a, name='A', trial_ends_at=timezone.now() + timedelta(days=30))
        self.business_b = Business.objects.create(owner=self.user_b, name='B', trial_ends_at=timezone.now() + timedelta(days=30))
        Membership.objects.create(user=self.user_a, business=self.business_a, role='owner')
        Membership.objects.create(user=self.user_b, business=self.business_b, role='owner')
        self.customer_b = Customer.objects.create(
            business=self.business_b, name='Business B Customer', phone='08000000000',
        )
        self.client.force_authenticate(self.user_a)

    @patch('customers.views.send_customer_reminder_email', return_value=True)
    @override_settings(CRON_SECRET='secret-token')
    def test_cron_endpoint_rejects_missing_or_invalid_secret_and_sends_only_when_valid(self, mock_send):
        customer = Customer.objects.create(
            business=self.business_a,
            name='Reminder customer',
            phone='08020000001',
            email='reminder@example.com',
        )
        Invoice.objects.create(
            business=self.business_a,
            customer=customer,
            doc_type=Invoice.INVOICE,
            status=Invoice.UNPAID,
            doc_number='INV-0009',
            total=Decimal('120.00'),
            issue_date=(timezone.now() - timedelta(days=15)).date(),
            due_date=(timezone.now() - timedelta(days=7)).date(),
        )

        missing = self.client.post('/api/cron/send-reminders/', format='json')
        self.assertEqual(missing.status_code, status.HTTP_403_FORBIDDEN)

        invalid = self.client.post('/api/cron/send-reminders/', {'secret': 'wrong-token'}, format='json')
        self.assertEqual(invalid.status_code, status.HTTP_403_FORBIDDEN)

        valid = self.client.post('/api/cron/send-reminders/', {'secret': 'secret-token'}, format='json')
        self.assertEqual(valid.status_code, status.HTTP_200_OK)
        self.assertGreaterEqual(valid.data['sent'], 1)
        self.assertTrue(CustomerReminder.objects.filter(customer=customer, reminder_type=CustomerReminder.PAYMENT).exists())
        self.assertEqual(mock_send.call_count, 1)

    @patch('customers.views.send_customer_reminder_email', return_value=True)
    @override_settings(CRON_SECRET='secret-token')
    def test_cron_endpoint_respects_reengagement_cooldown(self, mock_send):
        customer = Customer.objects.create(
            business=self.business_a,
            name='Dormant customer',
            phone='08030000001',
            email='dormant@example.com',
        )
        Sale.objects.create(
            business=self.business_a,
            customer=customer,
            product_name='Old order',
            quantity=1,
            unit_price=Decimal('50.00'),
            total=Decimal('50.00'),
            payment_method='cash',
            sold_at=timezone.now() - timedelta(days=90),
        )
        CustomerReminder.objects.create(
            business=self.business_a,
            customer=customer,
            reminder_type=CustomerReminder.REENGAGEMENT,
            subject='We miss you',
            email='dormant@example.com',
            sent_at=timezone.now() - timedelta(days=10),
        )

        response = self.client.post('/api/cron/send-reminders/', {'secret': 'secret-token'}, format='json')

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(mock_send.call_count, 0)
        self.assertEqual(CustomerReminder.objects.filter(customer=customer, reminder_type=CustomerReminder.REENGAGEMENT).count(), 1)

    @patch('customers.views.send_trial_expired_email', return_value=True)
    @patch('customers.views.send_trial_reminder_email', return_value=True)
    @override_settings(CRON_SECRET='secret-token')
    def test_cron_endpoint_sends_trial_reminders_and_expiration_email(self, mock_reminder, mock_expired):
        active_trial = Business.objects.create(
            owner=self.user_a,
            name='Trial Reminder Business',
            email='owner@trial.local',
            trial_started_at=timezone.now() - timedelta(days=2),
            trial_ends_at=timezone.now() + timedelta(days=3),
        )
        expired_trial = Business.objects.create(
            owner=self.user_a,
            name='Expired Trial Business',
            email='owner@expired.local',
            trial_started_at=timezone.now() - timedelta(days=10),
            trial_ends_at=timezone.now() - timedelta(minutes=5),
        )
        Membership.objects.create(user=self.user_a, business=active_trial, role='owner')
        Membership.objects.create(user=self.user_a, business=expired_trial, role='owner')

        response = self.client.post('/api/cron/send-reminders/', {'secret': 'secret-token'}, format='json')

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(mock_reminder.called)
        self.assertTrue(mock_expired.called)
        self.assertTrue(any(
            call.args[0].email == 'owner@trial.local'
            and call.args[0].name == 'Trial Reminder Business'
            and call.args[1] == 3
            for call in mock_reminder.call_args_list
        ))

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

    def test_customer_segments_and_owing_amount_are_computed(self):
        new_customer = Customer.objects.create(business=self.business_a, name='New', phone='08010000001')
        repeat_customer = Customer.objects.create(business=self.business_a, name='Repeat', phone='08010000002')
        at_risk_customer = Customer.objects.create(business=self.business_a, name='At Risk', phone='08010000003')
        inactive_customer = Customer.objects.create(business=self.business_a, name='Inactive', phone='08010000004')

        Sale.objects.create(
            business=self.business_a, customer=new_customer, product_name='Starter bundle', quantity=1,
            unit_price=Decimal('200.00'), total=Decimal('200.00'), payment_method='cash',
            sold_at=timezone.now() - timedelta(days=12),
        )
        Sale.objects.create(
            business=self.business_a, customer=repeat_customer, product_name='Repeat A', quantity=1,
            unit_price=Decimal('100.00'), total=Decimal('100.00'), payment_method='cash',
            sold_at=timezone.now() - timedelta(days=5),
        )
        Sale.objects.create(
            business=self.business_a, customer=repeat_customer, product_name='Repeat B', quantity=1,
            unit_price=Decimal('300.00'), total=Decimal('300.00'), payment_method='cash',
            sold_at=timezone.now() - timedelta(days=20),
        )
        Sale.objects.create(
            business=self.business_a, customer=at_risk_customer, product_name='At Risk Order 1', quantity=1,
            unit_price=Decimal('250.00'), total=Decimal('250.00'), payment_method='cash',
            sold_at=timezone.now() - timedelta(days=80),
        )
        Sale.objects.create(
            business=self.business_a, customer=at_risk_customer, product_name='At Risk Order 2', quantity=1,
            unit_price=Decimal('450.00'), total=Decimal('450.00'), payment_method='cash',
            sold_at=timezone.now() - timedelta(days=45),
        )
        Sale.objects.create(
            business=self.business_a, customer=inactive_customer, product_name='Inactive Order 1', quantity=1,
            unit_price=Decimal('175.00'), total=Decimal('175.00'), payment_method='cash',
            sold_at=timezone.now() - timedelta(days=90),
        )
        Sale.objects.create(
            business=self.business_a, customer=inactive_customer, product_name='Inactive Order 2', quantity=1,
            unit_price=Decimal('220.00'), total=Decimal('220.00'), payment_method='cash',
            sold_at=timezone.now() - timedelta(days=95),
        )

        Invoice.objects.create(
            business=self.business_a, customer=new_customer, doc_type=Invoice.INVOICE, status=Invoice.UNPAID,
            doc_number='INV-0001', total=Decimal('125.00'),
        )
        Invoice.objects.create(
            business=self.business_a, customer=new_customer, doc_type=Invoice.INVOICE, status=Invoice.PAID,
            doc_number='INV-0002', total=Decimal('75.00'),
        )
        Invoice.objects.create(
            business=self.business_a, customer=at_risk_customer, doc_type=Invoice.INVOICE, status=Invoice.UNPAID,
            doc_number='INV-0003', total=Decimal('55.50'),
        )

        response = self.client.get(f'/api/businesses/{self.business_a.pk}/customers/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data_by_id = {int(item['id']): item for item in response.data}

        self.assertEqual(data_by_id[new_customer.id]['segment'], 'New')
        self.assertEqual(data_by_id[repeat_customer.id]['segment'], 'Repeat')
        self.assertEqual(data_by_id[at_risk_customer.id]['segment'], 'At risk')
        self.assertEqual(data_by_id[inactive_customer.id]['segment'], 'Inactive')
        self.assertEqual(data_by_id[new_customer.id]['owing_amount'], '125.00')
        self.assertEqual(data_by_id[at_risk_customer.id]['owing_amount'], '55.50')
        self.assertEqual(data_by_id[new_customer.id]['total_spent'], '200.00')

        filtered = self.client.get(f'/api/businesses/{self.business_a.pk}/customers/?segment=Repeat')
        self.assertEqual(filtered.status_code, status.HTTP_200_OK)
        self.assertEqual(len(filtered.data), 1)
        self.assertEqual(filtered.data[0]['segment'], 'Repeat')
