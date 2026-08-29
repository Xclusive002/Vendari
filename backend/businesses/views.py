from datetime import timedelta

from django.db.models import F, Sum
from django.utils import timezone
from rest_framework import status, viewsets
from rest_framework.response import Response
from rest_framework.views import APIView

from accounts.permissions import IsBusinessMember

from .models import Business, Membership
from .serializers import BusinessSerializer, ConciergeInquirySerializer
from expenses.models import Expense
from inventory.models import InventoryItem
from sales.models import Sale


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


class BusinessDashboardSummaryView(APIView):
	permission_classes = [IsBusinessMember]

	def get(self, request, business_id):
		if not (
			Membership.objects.filter(user=request.user, business_id=business_id).exists()
			or Business.objects.filter(pk=business_id, owner=request.user).exists()
		):
			return Response({'detail': 'You must be a member of this business.'}, status=status.HTTP_403_FORBIDDEN)

		business = Business.objects.get(pk=business_id)
		sales = Sale.objects.filter(business=business)
		expenses = Expense.objects.filter(business=business)
		total_sales = sales.aggregate(value=Sum('total'))['value'] or 0
		total_expenses = expenses.aggregate(value=Sum('amount'))['value'] or 0
		trend_start = timezone.now() - timedelta(days=6)
		trend = sales.filter(sold_at__gte=trend_start).values('sold_at__date').annotate(amount=Sum('total')).order_by('sold_at__date')
		trend_by_date = {row['sold_at__date'].isoformat(): float(row['amount'] or 0) for row in trend}
		trend_data = []
		for offset in range(7):
			day = (trend_start + timedelta(days=offset)).date()
			trend_data.append({'date': day.isoformat(), 'amount': trend_by_date.get(day.isoformat(), 0)})

		products = sales.values('product_name').annotate(amount=Sum('total')).order_by('-amount')[:4]
		top_product_total = float(products[0]['amount'] or 0) if products else 0
		low_stock = InventoryItem.objects.filter(
			business=business,
			qty_in_stock__lte=F('reorder_level'),
		).values('product_name', 'qty_in_stock', 'reorder_level')[:20]
		low_stock_data = [
			[item['product_name'], item['qty_in_stock'], item['reorder_level'] or 10]
			for item in low_stock
			if item['qty_in_stock'] <= (item['reorder_level'] or 10)
		]

		return Response({
			'total_sales': float(total_sales),
			'orders': sales.count(),
			'total_expenses': float(total_expenses),
			'profit': float(total_sales - total_expenses),
			'trend': trend_data,
			'products': [
				{'name': row['product_name'], 'percentage': round((float(row['amount'] or 0) / top_product_total) * 100) if top_product_total else 0}
				for row in products
			],
			'low_stock': low_stock_data,
		})
