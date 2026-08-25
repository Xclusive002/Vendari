from rest_framework_nested import routers

from .views import CustomerViewSet

router = routers.SimpleRouter()
router.register('customers', CustomerViewSet, basename='business-customers')
urlpatterns = router.urls
