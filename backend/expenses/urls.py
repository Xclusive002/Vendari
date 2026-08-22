from rest_framework_nested import routers

from .views import ExpenseViewSet

router = routers.SimpleRouter()
router.register('expenses', ExpenseViewSet, basename='business-expenses')
urlpatterns = router.urls