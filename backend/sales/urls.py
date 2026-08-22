from rest_framework_nested import routers

from .views import SaleViewSet

router = routers.SimpleRouter()
router.register('sales', SaleViewSet, basename='business-sales')
urlpatterns = router.urls