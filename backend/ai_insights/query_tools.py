from datetime import date, timedelta

from django.db.models import Sum

from expenses.models import Expense
from sales.models import Sale


def _parse_date(value):
    return date.fromisoformat(value) if value else None


def get_sales_total(business, date_from=None, date_to=None):
    queryset = Sale.objects.filter(business=business)
    if date_from:
        queryset = queryset.filter(sold_at__date__gte=_parse_date(date_from))
    if date_to:
        queryset = queryset.filter(sold_at__date__lte=_parse_date(date_to))
    total = queryset.aggregate(total=Sum('total'))['total'] or 0
    return {'total_sales': float(total), 'date_from': date_from, 'date_to': date_to}


def get_top_products(business, n=5):
    n = max(1, min(int(n), 20))
    rows = Sale.objects.filter(business=business).values('product_name').annotate(
        quantity=Sum('quantity'),
        revenue=Sum('total'),
    ).order_by('-quantity')[:n]
    return {
        'products': [
            {'product_name': row['product_name'], 'quantity': row['quantity'], 'revenue': float(row['revenue'] or 0)}
            for row in rows
        ],
        'limit': n,
    }


def get_expense_breakdown(business, date_from=None, date_to=None):
    queryset = Expense.objects.filter(business=business)
    if date_from:
        queryset = queryset.filter(date__gte=_parse_date(date_from))
    if date_to:
        queryset = queryset.filter(date__lte=_parse_date(date_to))
    rows = queryset.values('category').annotate(total=Sum('amount')).order_by('-total')
    return {
        'categories': [
            {'category': row['category'], 'total': float(row['total'] or 0)}
            for row in rows
        ],
        'date_from': date_from,
        'date_to': date_to,
    }


QUERY_TOOLS = {
    'get_sales_total': get_sales_total,
    'get_top_products': get_top_products,
    'get_expense_breakdown': get_expense_breakdown,
}

QUERY_TOOL_DEFINITIONS = [
    {
        'name': 'get_sales_total',
        'description': 'Get total sales revenue for the business over an optional date range.',
        'input_schema': {'type': 'object', 'properties': {
            'date_from': {'type': 'string', 'description': 'ISO date, inclusive.'},
            'date_to': {'type': 'string', 'description': 'ISO date, inclusive.'},
        }},
    },
    {
        'name': 'get_top_products',
        'description': 'Get the top products by quantity sold for the business.',
        'input_schema': {'type': 'object', 'properties': {
            'n': {'type': 'integer', 'minimum': 1, 'maximum': 20},
        }},
    },
    {
        'name': 'get_expense_breakdown',
        'description': 'Get expenses grouped by category over an optional date range.',
        'input_schema': {'type': 'object', 'properties': {
            'date_from': {'type': 'string', 'description': 'ISO date, inclusive.'},
            'date_to': {'type': 'string', 'description': 'ISO date, inclusive.'},
        }},
    },
]