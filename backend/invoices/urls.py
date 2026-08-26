from rest_framework_nested import routers

from .views import InvoiceViewSet

router = routers.SimpleRouter()
router.register('invoices', InvoiceViewSet, basename='business-invoices')
urlpatterns = router.urls
