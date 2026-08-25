from rest_framework import viewsets

from accounts.permissions import IsBusinessMember
from businesses.models import Business, Membership

from .models import Customer
from .serializers import CustomerSerializer


class CustomerViewSet(viewsets.ModelViewSet):
    serializer_class = CustomerSerializer
    permission_classes = [IsBusinessMember]

    def get_queryset(self):
        memberships = Membership.objects.filter(user=self.request.user).values('business_id')
        business_id = self.kwargs.get('business_pk', self.kwargs.get('business_id'))
        return Customer.objects.filter(business_id=business_id, business_id__in=memberships)

    def perform_create(self, serializer):
        serializer.save(business=Business.objects.get(pk=self.kwargs.get('business_pk', self.kwargs.get('business_id'))))
