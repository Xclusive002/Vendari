import json
import math
import urllib.error
import urllib.request
from datetime import timedelta
from decimal import Decimal

from celery import shared_task
from django.conf import settings
from django.db.models import Avg, Sum
from django.utils import timezone

from businesses.models import Business
from expenses.models import Expense
from inventory.models import InventoryItem
from sales.models import Sale

from .models import AIInsight


def _number(value):
    return float(value or 0)


def _percentage_change(current, previous):
    if previous == 0:
        return 100.0 if current > 0 else 0.0
    return round(((current - previous) / previous) * 100, 2)


def _summarize(payload):
    if not settings.ANTHROPIC_API_KEY:
        return 'Computed from your business data; an AI summary is unavailable until Anthropic is configured.'
    request_body = json.dumps({
        'model': 'claude-sonnet-4-6',
        'max_tokens': 300,
        'system': 'Explain only the supplied numbers in one or two plain-language sentences for a small business owner with no accounting background. Do not calculate, infer, or introduce any numbers not present in the payload.',
        'messages': [{'role': 'user', 'content': json.dumps(payload, separators=(',', ':'))}],
    }).encode()
    request = urllib.request.Request(
        'https://api.anthropic.com/v1/messages',
        data=request_body,
        headers={
            'x-api-key': settings.ANTHROPIC_API_KEY,
            'anthropic-version': '2023-06-01',
            'content-type': 'application/json',
        },
        method='POST',
    )
    try:
        with urllib.request.urlopen(request, timeout=20) as response:
            data = json.loads(response.read())
        return ''.join(block.get('text', '') for block in data.get('content', [])).strip() or 'No AI summary was returned.'
    except (urllib.error.URLError, TimeoutError, json.JSONDecodeError):
        return 'The computed figures are available below; an AI summary could not be generated right now.'


def _create_insight(business, insight_type, payload):
    return AIInsight.objects.create(
        business=business,
        insight_type=insight_type,
        payload=payload,
        summary_text=_summarize(payload),
    )


@shared_task
def compute_business_insights(business_id):
    business = Business.objects.get(pk=business_id)
    now = timezone.now()
    current_30_start = now - timedelta(days=30)
    current_7_start = now - timedelta(days=7)
    prior_30_start = now - timedelta(days=60)
    prior_7_start = now - timedelta(days=14)
    insights = []

    items = InventoryItem.objects.filter(business=business)
    for item in items:
        sales_30 = Sale.objects.filter(item=item, sold_at__gte=current_30_start).aggregate(quantity=Sum('quantity'))['quantity'] or 0
        velocity = float(sales_30) / 30
        days_until_stockout = float(item.qty_in_stock / velocity) if velocity else None
        if velocity and days_until_stockout <= 30:
            insights.append(_create_insight(business, 'stockout_risk', {
                'inventory_item_id': item.pk,
                'product_name': item.product_name,
                'current_qty_in_stock': item.qty_in_stock,
                'sales_quantity_last_30_days': sales_30,
                'average_daily_sale_velocity': round(velocity, 4),
                'estimated_days_until_stockout': round(days_until_stockout, 2),
            }))

    if Sale.objects.filter(business=business).exists() or Expense.objects.filter(business=business).exists() or items.exists():
        for period_days, start, prior_start in ((7, current_7_start, prior_7_start), (30, current_30_start, prior_30_start)):
            previous_end = start
            sales = _number(Sale.objects.filter(business=business, sold_at__gte=start).aggregate(total=Sum('total'))['total'])
            prior_sales = _number(Sale.objects.filter(business=business, sold_at__gte=prior_start, sold_at__lt=previous_end).aggregate(total=Sum('total'))['total'])
            expenses = _number(Expense.objects.filter(business=business, date__gte=start.date()).aggregate(total=Sum('amount'))['total'])
            prior_expenses = _number(Expense.objects.filter(business=business, date__gte=prior_start.date(), date__lt=previous_end.date()).aggregate(total=Sum('amount'))['total'])
            insights.append(_create_insight(business, f'financial_summary_{period_days}d', {
                'period_days': period_days,
                'total_sales': sales,
                'total_expenses': expenses,
                'sales_percentage_change_vs_prior_period': _percentage_change(sales, prior_sales),
                'expenses_percentage_change_vs_prior_period': _percentage_change(expenses, prior_expenses),
            }))

    expenses_30 = Expense.objects.filter(business=business, date__gte=current_30_start.date())
    average = expenses_30.aggregate(value=Avg('amount'))['value']
    values = [_number(value) for value in expenses_30.values_list('amount', flat=True)]
    if values and average is not None:
        mean = _number(average)
        standard_deviation = math.sqrt(sum((value - mean) ** 2 for value in values) / len(values))
        threshold = mean + (2 * standard_deviation)
        for expense in expenses_30:
            if _number(expense.amount) > threshold:
                insights.append(_create_insight(business, 'expense_anomaly', {
                    'expense_id': expense.pk,
                    'expense_amount': _number(expense.amount),
                    'average_expense_amount': round(mean, 2),
                    'expense_standard_deviation': round(standard_deviation, 2),
                    'anomaly_threshold': round(threshold, 2),
                    'expense_date': expense.date.isoformat(),
                }))
    return len(insights)


@shared_task
def compute_all_business_insights():
    return sum(compute_business_insights(business.pk) for business in Business.objects.all())