"""
URL configuration for vendari_api project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/5.2/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""
from django.contrib import admin
from django.http import JsonResponse
from django.urls import include, path
from django.conf import settings
from django.conf.urls.static import static
from rest_framework_nested import routers

from businesses.views import BusinessViewSet, ConciergeInquiryView
from inventory.views import InventoryItemViewSet
from sales.views import SaleViewSet
from expenses.views import ExpenseViewSet
from customers.views import CustomerViewSet
from billing.views import PaystackInitializeView, PaystackWebhookView
from ai_insights.views import BusinessAskView, BusinessInsightsView
from invoices.views import InvoiceViewSet, SaleReceiptView, GenerateInvoiceNotesView

business_router = routers.SimpleRouter()
business_router.register('businesses', BusinessViewSet, basename='business')

inventory_router = routers.NestedSimpleRouter(business_router, 'businesses', lookup='business')
inventory_router.register('inventory', InventoryItemViewSet, basename='business-inventory')
sales_router = routers.NestedSimpleRouter(business_router, 'businesses', lookup='business')
sales_router.register('sales', SaleViewSet, basename='business-sales')
expenses_router = routers.NestedSimpleRouter(business_router, 'businesses', lookup='business')
expenses_router.register('expenses', ExpenseViewSet, basename='business-expenses')
customers_router = routers.NestedSimpleRouter(business_router, 'businesses', lookup='business')
customers_router.register('customers', CustomerViewSet, basename='business-customers')
invoices_router = routers.NestedSimpleRouter(business_router, 'businesses', lookup='business')
invoices_router.register('invoices', InvoiceViewSet, basename='business-invoices')


def health_check(request):
    return JsonResponse({'status': 'ok', 'service': 'vendari-api'})

urlpatterns = [
    path('', health_check, name='health-check'),
    path('admin/', admin.site.urls),
    path('api/auth/', include('accounts.urls')),
    path('api/concierge-inquiries/', ConciergeInquiryView.as_view()),
    path('api/billing/paystack/initialize/', PaystackInitializeView.as_view()),
    path('api/billing/paystack/webhook/', PaystackWebhookView.as_view()),
    path('api/businesses/<int:business_id>/ai-insights/', BusinessInsightsView.as_view()),
    path('api/businesses/<int:business_id>/ask/', BusinessAskView.as_view()),
    path('api/businesses/<int:business_id>/sales/<int:sale_id>/receipt/', SaleReceiptView.as_view()),
    path('api/businesses/<int:business_id>/invoices/generate-notes/', GenerateInvoiceNotesView.as_view()),
    path('api/notifications/', include('notifications.urls')),
    path('api/', include(business_router.urls)),
    path('api/', include(inventory_router.urls)),
    path('api/', include(sales_router.urls)),
    path('api/', include(expenses_router.urls)),
    path('api/', include(customers_router.urls)),
    path('api/', include(invoices_router.urls)),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
