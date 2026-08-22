from datetime import timedelta
from unittest.mock import patch

from django.utils import timezone
from rest_framework import status
from rest_framework.test import APITestCase

from accounts.models import User
from businesses.models import Business, Membership
from expenses.models import Expense
from inventory.models import InventoryItem
from sales.models import Sale

from .models import AIInsight
from .tasks import compute_business_insights
from .query_service import answer_business_question


class InsightsTests(APITestCase):
	def setUp(self):
		self.user = User.objects.create_user('insights@test.local', 'password123')
		self.business = Business.objects.create(owner=self.user, name='Insights Test')
		Membership.objects.create(user=self.user, business=self.business, role='owner')
		self.item = InventoryItem.objects.create(
			business=self.business, product_name='Fast item', qty_in_stock=2,
			reorder_level=1, cost_price='5.00', selling_price='10.00',
		)
		Sale.objects.create(
			business=self.business, item=self.item, product_name='Fast item', quantity=30,
			unit_price='10.00', total='300.00', payment_method='cash',
			sold_at=timezone.now() - timedelta(days=2),
		)
		Expense.objects.create(
			business=self.business, date=timezone.now().date() - timedelta(days=2),
			category='rent', amount='100.00', payment_method='cash',
		)
		Expense.objects.create(
			business=self.business, date=timezone.now().date() - timedelta(days=1),
			category='equipment', amount='2000.00', payment_method='cash',
		)
		for days_ago in (3, 4, 5, 6):
			Expense.objects.create(
				business=self.business,
				date=timezone.now().date() - timedelta(days=days_ago),
				category='supplies',
				amount='100.00',
				payment_method='cash',
			)

	@patch('ai_insights.tasks._summarize', return_value='Test summary')
	def test_task_creates_computed_insights_from_seeded_data(self, summarize):
		created = compute_business_insights(self.business.pk)
		self.assertGreaterEqual(created, 3)
		self.assertTrue(AIInsight.objects.filter(business=self.business, insight_type='stockout_risk').exists())
		self.assertTrue(AIInsight.objects.filter(business=self.business, insight_type='financial_summary_7d').exists())
		self.assertTrue(AIInsight.objects.filter(business=self.business, insight_type='expense_anomaly').exists())
		self.assertEqual(AIInsight.objects.first().summary_text, 'Test summary')

	def test_insights_endpoint_feature_gate(self):
		self.client.force_authenticate(self.user)
		from billing.models import Plan

		self.business.plan = Plan.objects.create(name='pro', feature_flags={'ai_insights': False})
		self.business.save(update_fields=['plan'])
		response = self.client.get(f'/api/businesses/{self.business.pk}/ai-insights/')
		self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

	@patch('ai_insights.query_service._anthropic_request')
	def test_ask_data_used_matches_server_tool_result(self, anthropic_request):
		anthropic_request.side_effect = [
			{'content': [{'type': 'tool_use', 'id': 'tool-1', 'name': 'get_sales_total', 'input': {'date_from': '2026-01-01', 'date_to': '2026-01-31'}}]},
			{'content': [{'type': 'text', 'text': 'Your sales total was 123.45.'}]},
		]
		from billing.models import Plan

		self.business.plan = Plan.objects.create(name='pro')
		self.business.save(update_fields=['plan'])
		self.client.force_authenticate(self.user)
		response = self.client.post(
			f'/api/businesses/{self.business.pk}/ask/',
			{'question': 'How much did I sell in January?'},
			format='json',
		)
		self.assertEqual(response.status_code, status.HTTP_200_OK)
		self.assertEqual(response.data['data_used']['get_sales_total']['total_sales'], 0.0)
