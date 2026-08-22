from rest_framework_nested import routers

from .views import InventoryItemViewSet

router = routers.SimpleRouter()
router.register('inventory', InventoryItemViewSet, basename='business-inventory')
urlpatterns = router.urls