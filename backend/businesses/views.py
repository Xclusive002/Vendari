from rest_framework import status, viewsets
from rest_framework.response import Response
from rest_framework.views import APIView

from accounts.permissions import IsBusinessMember

from .models import Business
from .serializers import BusinessSerializer, ConciergeInquirySerializer


class BusinessViewSet(viewsets.ModelViewSet):
	permission_classes = [IsBusinessMember]
	serializer_class = BusinessSerializer

	def get_queryset(self):
		return Business.objects.filter(membership__user=self.request.user).distinct()

	def perform_create(self, serializer):
		business = serializer.save(owner=self.request.user)
		business.membership_set.create(user=self.request.user, role='owner')


class ConciergeInquiryView(APIView):
	permission_classes = []

	def post(self, request):
		serializer = ConciergeInquirySerializer(data=request.data)
		if serializer.is_valid():
			inquiry = serializer.save()
			return Response(ConciergeInquirySerializer(inquiry).data, status=status.HTTP_201_CREATED)
		return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
