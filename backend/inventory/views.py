from rest_framework import viewsets

from accounts.permissions import IsBusinessMember
from businesses.models import Business, Membership

from .models import InventoryItem
from .serializers import InventoryItemSerializer


class BusinessScopedViewSet(viewsets.ModelViewSet):
    permission_classes = [IsBusinessMember]

    def business(self):
        return Business.objects.get(pk=self.kwargs.get('business_pk', self.kwargs.get('business_id')))

    def get_queryset(self):
        memberships = Membership.objects.filter(user=self.request.user).values('business_id')
        business_id = self.kwargs.get('business_pk', self.kwargs.get('business_id'))
        return InventoryItem.objects.filter(business_id=business_id, business_id__in=memberships)

    def get_serializer_context(self):
        context = super().get_serializer_context()
        context['business'] = self.business()
        return context

    def perform_create(self, serializer):
        serializer.save(business=self.business())


class InventoryItemViewSet(BusinessScopedViewSet):
    serializer_class = InventoryItemSerializer
