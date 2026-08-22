from rest_framework import viewsets

from accounts.permissions import IsBusinessMember
from businesses.models import Business, Membership

from .models import Sale
from .serializers import SaleSerializer


class SaleViewSet(viewsets.ModelViewSet):
    serializer_class = SaleSerializer
    permission_classes = [IsBusinessMember]

    def get_queryset(self):
        memberships = Membership.objects.filter(user=self.request.user).values('business_id')
        business_id = self.kwargs.get('business_pk', self.kwargs.get('business_id'))
        queryset = Sale.objects.filter(business_id=business_id, business_id__in=memberships)
        date_from = self.request.query_params.get('date_from')
        date_to = self.request.query_params.get('date_to')
        if date_from:
            queryset = queryset.filter(sold_at__date__gte=date_from)
        if date_to:
            queryset = queryset.filter(sold_at__date__lte=date_to)
        return queryset

    def get_serializer_context(self):
        context = super().get_serializer_context()
        context['business'] = Business.objects.get(pk=self.kwargs.get('business_pk', self.kwargs.get('business_id')))
        return context

    def perform_create(self, serializer):
        serializer.save(business=Business.objects.get(pk=self.kwargs.get('business_pk', self.kwargs.get('business_id'))))
