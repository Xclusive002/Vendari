from datetime import timedelta
from django.utils import timezone
from django.db.models import Count, Q
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.views import APIView

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


class TopProductsView(APIView):
	"""
	GET /api/businesses/{business_id}/top-products/?limit=20
	
	Returns the business's most frequently sold products over the last 90 days.
	Falls back to most recently added items if insufficient sales history.
	
	Response: [{"id": 1, "product_name": "...", "selling_price": N, "qty_in_stock": N, ...}]
	"""
	permission_classes = [IsBusinessMember]

	def get(self, request, business_id):
		# Verify membership
		if not Membership.objects.filter(user=request.user, business_id=business_id).exists():
			return Response({'detail': 'You must be a member of this business.'}, status=status.HTTP_403_FORBIDDEN)
		
		# Get business
		try:
			business = Business.objects.get(pk=business_id)
		except Business.DoesNotExist:
			return Response({'detail': 'Business not found.'}, status=status.HTTP_404_NOT_FOUND)
		
		# Parse limit parameter (default 20, max 50)
		limit = int(request.query_params.get('limit', 20))
		limit = min(limit, 50)
		
		# Calculate date cutoff (90 days ago)
		cutoff_date = timezone.now() - timedelta(days=90)
		
		# Get inventory items with sale counts from last 90 days
		from sales.models import Sale
		
		# Rank by frequency of sales in last 90 days
		top_items = (
			InventoryItem.objects
			.filter(business=business)
			.annotate(
				sales_count=Count(
					'sales',
					filter=Q(sales__sold_at__gte=cutoff_date)
				)
			)
			.order_by('-sales_count', '-created_at')[:limit]
		)
		
		# If no sales history, fall back to most recently added items
		if not top_items.exists() or top_items[0].sales_count == 0:
			top_items = (
				InventoryItem.objects
				.filter(business=business)
				.order_by('-created_at')[:limit]
			)
		
		serializer = InventoryItemSerializer(top_items, many=True)
		return Response(serializer.data)
