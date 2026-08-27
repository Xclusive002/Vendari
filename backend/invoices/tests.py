from decimal import Decimal

from rest_framework import status
from rest_framework.test import APITestCase
from unittest.mock import patch

from accounts.models import User
from businesses.models import Business, Membership
from customers.models import Customer
from inventory.models import InventoryItem
from sales.models import Sale

from .models import Invoice


class InvoiceApiTests(APITestCase):
    def setUp(self):
        self.user_a = User.objects.create_user('a@invoices.local', 'password123')
        self.user_b = User.objects.create_user('b@invoices.local', 'password123')
        self.business_a = Business.objects.create(owner=self.user_a, name='A')
        self.business_b = Business.objects.create(owner=self.user_b, name='B')
        Membership.objects.create(user=self.user_a, business=self.business_a, role='owner')
        Membership.objects.create(user=self.user_b, business=self.business_b, role='owner')
        self.customer_a = Customer.objects.create(business=self.business_a, name='Customer A', phone='08000000001')
        self.customer_b = Customer.objects.create(business=self.business_b, name='Customer B', phone='08000000002')
        self.item_a = InventoryItem.objects.create(
            business=self.business_a, product_name='Widget', qty_in_stock=5,
            reorder_level=1, cost_price='1.00', selling_price='12.50',
        )
        self.sale_a = Sale.objects.create(
            business=self.business_a, item=self.item_a, customer=self.customer_a,
            product_name='Widget', quantity=2, unit_price='12.50', total='25.00',
            payment_method='cash',
        )
        self.client.force_authenticate(self.user_a)
        self.url = f'/api/businesses/{self.business_a.pk}/invoices/'

    def test_business_a_cannot_access_business_b_invoices(self):
        invoice_b = Invoice.objects.create(
            business=self.business_b, customer=self.customer_b, doc_type=Invoice.INVOICE,
            status=Invoice.UNPAID,
        )
        url = f'/api/businesses/{self.business_b.pk}/invoices/'
        self.assertEqual(self.client.get(url).status_code, status.HTTP_403_FORBIDDEN)
        detail_url = f'{url}{invoice_b.pk}/'
        self.assertEqual(self.client.get(detail_url).status_code, status.HTTP_403_FORBIDDEN)

    def test_doc_numbers_sequence_per_business_and_type(self):
        first = Invoice.objects.create(business=self.business_a, doc_type=Invoice.RECEIPT, status=Invoice.PAID)
        second = Invoice.objects.create(business=self.business_a, doc_type=Invoice.RECEIPT, status=Invoice.PAID)
        invoice = Invoice.objects.create(business=self.business_a, doc_type=Invoice.INVOICE, status=Invoice.UNPAID)
        self.assertEqual(first.doc_number, 'RCT-0001')
        self.assertEqual(second.doc_number, 'RCT-0002')
        self.assertEqual(invoice.doc_number, 'INV-0001')

    def test_nested_create_computes_line_totals_and_invoice_totals(self):
        response = self.client.post(self.url, {
            'customer': self.customer_a.pk, 'doc_type': 'invoice', 'status': 'unpaid',
            'tax_amount': '2.50', 'line_items': [
                {'description': 'Widget', 'quantity': 2, 'unit_price': '12.50'},
            ],
        }, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['doc_number'], 'INV-0001')
        self.assertEqual(response.data['subtotal'], '25.00')
        self.assertEqual(response.data['total'], '27.50')
        self.assertEqual(response.data['line_items'][0]['line_total'], '25.00')

    def test_receipt_copies_sale_data(self):
        response = self.client.post(f'/api/businesses/{self.business_a.pk}/sales/{self.sale_a.pk}/receipt/')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['doc_type'], Invoice.RECEIPT)
        self.assertEqual(response.data['status'], Invoice.PAID)
        self.assertEqual(response.data['linked_sale'], self.sale_a.pk)
        self.assertEqual(response.data['customer'], self.customer_a.pk)
        self.assertEqual(response.data['doc_number'], 'RCT-0001')
        self.assertEqual(response.data['line_items'][0]['description'], 'Widget')
        self.assertEqual(response.data['line_items'][0]['quantity'], 2)
        self.assertEqual(response.data['line_items'][0]['unit_price'], '12.50')
        self.assertEqual(Decimal(response.data['total']), Decimal('25.00'))

    @patch('invoices.views.generate_content')
    @patch('invoices.views.response_text', return_value='{"line_items": [{"description": "Cement", "quantity": 5, "unit_price": 8000}], "notes": "Due in 14 days."}')
    @patch('invoices.views.settings.GEMINI_API_KEY', 'test-key')
    def test_generate_notes_returns_json_mode_line_items(self, response_text_mock, generate_content_mock):
        response = self.client.post(
            f'/api/businesses/{self.business_a.pk}/invoices/generate-notes/',
            {'description': '5 bags of cement at 8000 each'},
            format='json',
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['line_items'][0]['description'], 'Cement')
        self.assertEqual(response.data['line_items'][0]['quantity'], 5)
        self.assertEqual(response.data['line_items'][0]['unit_price'], 8000.0)
        generate_content_mock.assert_called_once()
        self.assertEqual(generate_content_mock.call_args.kwargs['response_mime_type'], 'application/json')

    @patch('invoices.views.generate_content', side_effect=Exception('ConnectError: [Errno 11002] getaddrinfo failed'))
    @patch('invoices.views.settings.GEMINI_API_KEY', 'test-key')
    def test_generate_notes_exposes_network_failure(self, generate_content_mock):
        response = self.client.post(
            f'/api/businesses/{self.business_a.pk}/invoices/generate-notes/',
            {'description': '5 bags of cement at 8000 each'},
            format='json',
        )
        self.assertEqual(response.status_code, status.HTTP_502_BAD_GATEWAY)
        self.assertIn('unreachable', response.data['detail'])
