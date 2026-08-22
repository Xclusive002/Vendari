from rest_framework import viewsets

from accounts.permissions import IsBusinessMember

from .models import Business
from .serializers import BusinessSerializer


class BusinessViewSet(viewsets.ModelViewSet):
	permission_classes = [IsBusinessMember]
	serializer_class = BusinessSerializer

	def get_queryset(self):
		return Business.objects.filter(membership__user=self.request.user).distinct()

	def perform_create(self, serializer):
		business = serializer.save(owner=self.request.user)
		business.membership_set.create(user=self.request.user, role='owner')
