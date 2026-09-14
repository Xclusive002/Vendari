from datetime import timedelta
from decimal import Decimal, InvalidOperation
from urllib.parse import quote

from django.db import transaction
from django.db.models import F, Sum
from django.utils import timezone
from rest_framework import status, viewsets
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated

from accounts.permissions import IsBusinessMember
from billing.models import Plan
from billing.utils import has_feature

from .models import Business, Membership, StorefrontOrder, StorefrontOrderLineItem, StorefrontSettings
from .serializers import BusinessSerializer, ConciergeInquirySerializer, StorefrontSettingsSerializer
from expenses.models import Expense
from inventory.models import InventoryItem
from inventory.serializers import PublicInventoryItemSerializer
from sales.models import Sale
from sales.serializers import SaleSerializer
from billing.views import paystack_request


class BusinessViewSet(viewsets.ModelViewSet):
	permission_classes = [IsBusinessMember]
	serializer_class = BusinessSerializer

	def get_queryset(self):
		return Business.objects.filter(membership__user=self.request.user).distinct()

	def perform_create(self, serializer):
		business = serializer.save(owner=self.request.user)
		# Assign the paid plan and start the trial for every new business.
		if not business.plan:
			default_plan, _ = Plan.objects.get_or_create(name=Plan.PLAN_PRO, interval=Plan.INTERVAL_MONTHLY, defaults={
				'amount': 9999,
				'interval': Plan.INTERVAL_MONTHLY,
				'feature_flags': {
					'ai_insights': False,
					'nl_reporting': False,
					'forecasting': False,
					'voice_entry': False,
					'invoice_ai': False,
					'advanced_reports': False,
					'payments': False,
					'team_members': False,
				}
			})
			trial_started_at = timezone.now()
			business.plan = default_plan
			business.trial_started_at = trial_started_at
			business.trial_ends_at = trial_started_at + timedelta(days=5)
			business.save(update_fields=['plan', 'trial_started_at', 'trial_ends_at'])
		business.membership_set.create(user=self.request.user, role='owner')


class ConciergeInquiryView(APIView):
	permission_classes = []

	def post(self, request):
		serializer = ConciergeInquirySerializer(data=request.data)
		if serializer.is_valid():
			inquiry = serializer.save()
			return Response(ConciergeInquirySerializer(inquiry).data, status=status.HTTP_201_CREATED)
		return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class BusinessPlansView(APIView):
	permission_classes = [IsAuthenticated]

	def get(self, request):
		return Response([
			{
				'id': plan.id,
				'name': plan.name,
				'amount': float(plan.amount),
				'interval': plan.interval,
				'feature_flags': plan.feature_flags,
				'limits': plan.limits,
			}
			for plan in Plan.objects.all().order_by('amount', 'id')
		])


class BusinessSubscriptionView(APIView):
	permission_classes = [IsBusinessMember]
	allow_expired_trial = True

	def get(self, request, business_id):
		business = Business.objects.filter(pk=business_id).first()
		if business is None:
			return Response({'detail': 'Business not found.'}, status=status.HTTP_404_NOT_FOUND)
		subscription = getattr(business, 'subscription', None)
		return Response({
			'plan': business.plan.name if business.plan else 'pro',
			'plan_id': business.plan_id,
			'status': subscription.status if subscription else ('trial' if business.trial_active else 'expired'),
			'renews_at': subscription.renews_at if subscription else None,
			'trial_active': business.trial_active,
			'trial_ends_at': business.trial_ends_at,
			'feature_flags': business.plan.feature_flags if business.plan else {},
		})


class BusinessMembersView(APIView):
	permission_classes = [IsBusinessMember]

	def _owner(self, request, business_id):
		return Business.objects.filter(pk=business_id, owner=request.user).exists()

	def get(self, request, business_id):
		members = Membership.objects.filter(business_id=business_id).select_related('user').order_by('created_at')
		invites = InviteCode.objects.filter(business_id=business_id, used=False, revoked_at__isnull=True).order_by('-created_at')
		return Response({
			'members': [{'id': member.id, 'email': member.user.email, 'role': member.role, 'created_at': member.created_at} for member in members],
			'invites': [{'id': invite.id, 'email': invite.email, 'code': invite.code, 'role': invite.role, 'expires_at': invite.expires_at} for invite in invites],
		})

	def post(self, request, business_id):
		if not self._owner(request, business_id):
			return Response({'detail': 'Only the business owner can manage team members.'}, status=status.HTTP_403_FORBIDDEN)
		business = Business.objects.get(pk=business_id)
		if not has_feature(business, 'team_members'):
			return Response({'detail': 'Team members are available on a paid plan.'}, status=status.HTTP_403_FORBIDDEN)
		from django.utils.crypto import get_random_string
		email = str(request.data.get('email', '')).strip().lower()
		role = str(request.data.get('role', Membership.ROLE_STAFF)).strip()
		if not email or role not in {Membership.ROLE_STAFF, Membership.ROLE_ACCOUNTANT}:
			return Response({'detail': 'A valid email and role are required.'}, status=status.HTTP_400_BAD_REQUEST)
		code = get_random_string(24).upper()
		invite = InviteCode.objects.create(business=business, code=code, email=email, role=role, expires_at=timezone.now() + timedelta(days=7))
		return Response({'id': invite.id, 'code': invite.code, 'role': invite.role}, status=status.HTTP_201_CREATED)

	def delete(self, request, business_id):
		if not self._owner(request, business_id):
			return Response({'detail': 'Only the business owner can manage team members.'}, status=status.HTTP_403_FORBIDDEN)
		member_id = request.data.get('member_id')
		member = Membership.objects.filter(id=member_id, business_id=business_id).exclude(role=Membership.ROLE_OWNER).first()
		if member is None:
			return Response({'detail': 'Team member not found.'}, status=status.HTTP_404_NOT_FOUND)
		member.delete()
		return Response(status=status.HTTP_204_NO_CONTENT)

	def patch(self, request, business_id):
		if not self._owner(request, business_id):
			return Response({'detail': 'Only the business owner can manage team members.'}, status=status.HTTP_403_FORBIDDEN)
		member = Membership.objects.filter(id=request.data.get('member_id'), business_id=business_id).exclude(role=Membership.ROLE_OWNER).first()
		role = str(request.data.get('role', '')).strip()
		if member is None or role not in {Membership.ROLE_STAFF, Membership.ROLE_ACCOUNTANT}:
			return Response({'detail': 'A valid team member and role are required.'}, status=status.HTTP_400_BAD_REQUEST)
		member.role = role
		member.save(update_fields=['role'])
		return Response({'id': member.id, 'role': member.role})

	def put(self, request, business_id):
		if not self._owner(request, business_id):
			return Response({'detail': 'Only the business owner can manage team members.'}, status=status.HTTP_403_FORBIDDEN)
		invite = InviteCode.objects.filter(id=request.data.get('invite_id'), business_id=business_id, used=False, revoked_at__isnull=True).first()
		if invite is None:
			return Response({'detail': 'Invite not found.'}, status=status.HTTP_404_NOT_FOUND)
		invite.revoked_at = timezone.now()
		invite.save(update_fields=['revoked_at'])
		return Response(status=status.HTTP_204_NO_CONTENT)

class StorefrontSlugCheckView(APIView):
    permission_classes = []

    def get(self, request):
        slug = request.query_params.get('slug', '').strip()
        normalized = StorefrontSettings.normalize_slug(slug)
        if not normalized:
            return Response({'available': False, 'message': 'Please enter a valid slug.'}, status=status.HTTP_400_BAD_REQUEST)
        available = normalized not in StorefrontSettings.RESERVED_SLUGS and not StorefrontSettings.objects.filter(slug=normalized).exists()
        return Response({'slug': normalized, 'available': available, 'message': 'Slug is available.' if available else 'Slug is already taken or reserved.'})


class StorefrontSettingsView(APIView):
    permission_classes = [IsBusinessMember]

    def get_object(self, business_id, user):
        business = Business.objects.filter(pk=business_id).first()
        if business is None:
            return None
        if not (Membership.objects.filter(user=user, business=business).exists() or business.owner == user):
            return None
        return StorefrontSettings.ensure_for_business(business)

    def get(self, request, business_id):
        storefront = self.get_object(business_id, request.user)
        if storefront is None:
            return Response({'detail': 'Business not found.'}, status=status.HTTP_404_NOT_FOUND)
        serializer = StorefrontSettingsSerializer(storefront, context={'request': request})
        return Response(serializer.data)

    def patch(self, request, business_id):
        storefront = self.get_object(business_id, request.user)
        if storefront is None:
            return Response({'detail': 'Business not found.'}, status=status.HTTP_404_NOT_FOUND)
        serializer = StorefrontSettingsSerializer(storefront, data=request.data, partial=True, context={'request': request})
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        was_published = storefront.is_published
        serializer.save()
        if not was_published and storefront.is_published:
            InventoryItem.objects.filter(business=storefront.business, selling_price__gt=0).update(is_visible_on_storefront=True)
        return Response(serializer.data)


class PublicStorefrontView(APIView):
	permission_classes = []

	def get(self, request, slug):
		storefront = StorefrontSettings.objects.select_related('business').filter(
			slug=StorefrontSettings.normalize_slug(slug),
			is_published=True,
		).first()
		if storefront is None:
			return Response({'detail': 'Storefront not found.'}, status=status.HTTP_404_NOT_FOUND)

		items = InventoryItem.objects.filter(
			business=storefront.business,
			is_visible_on_storefront=True,
		).order_by('product_name')
		return Response({
			'business_name': storefront.business.name,
			'has_payments_enabled': storefront.business.has_payments_enabled,
			'storefront': StorefrontSettingsSerializer(storefront, context={'request': request}).data,
			'items': PublicInventoryItemSerializer(items, many=True, context={'request': request}).data,
		})


class PublicStorefrontCheckoutView(APIView):
	permission_classes = []

	def post(self, request, slug):
		storefront = StorefrontSettings.objects.select_related('business').filter(
			slug=StorefrontSettings.normalize_slug(slug), is_published=True,
		).first()
		if storefront is None:
			return Response({'detail': 'Storefront not found.'}, status=status.HTTP_404_NOT_FOUND)

		customer_name = str(request.data.get('customer_name', '')).strip()
		customer_phone = str(request.data.get('customer_phone', '')).strip()
		customer_address = str(request.data.get('customer_address', '')).strip()
		delivery_option = str(request.data.get('delivery_option', '')).strip()
		checkout_method = str(request.data.get('checkout_method', '')).strip().lower()
		if not customer_name or not customer_phone:
			return Response({'detail': 'Customer name and phone are required.'}, status=status.HTTP_400_BAD_REQUEST)
		if delivery_option not in dict(StorefrontSettings.DELIVERY_CHOICES):
			return Response({'detail': 'Choose a valid delivery option.'}, status=status.HTTP_400_BAD_REQUEST)
		if checkout_method not in {'whatsapp', 'pay_now'}:
			return Response({'detail': 'Choose WhatsApp or Pay Now checkout.'}, status=status.HTTP_400_BAD_REQUEST)
		if checkout_method == 'pay_now' and not storefront.business.has_payments_enabled:
			return Response({'detail': 'Pay Now is unavailable until this business completes Payment Settings.'}, status=status.HTTP_409_CONFLICT)
		if checkout_method == 'whatsapp' and not ''.join(character for character in storefront.whatsapp_number if character.isdigit()):
			return Response({'detail': 'This storefront has not configured a WhatsApp number yet.'}, status=status.HTTP_409_CONFLICT)

		raw_items = request.data.get('items')
		if not isinstance(raw_items, list) or not raw_items:
			return Response({'detail': 'Your cart is empty.'}, status=status.HTTP_400_BAD_REQUEST)

		requested = {}
		for line in raw_items:
			name = str(line.get('product_name', '')).strip() if isinstance(line, dict) else ''
			try:
				quantity = int(line.get('quantity', 0)) if isinstance(line, dict) else 0
			except (TypeError, ValueError):
				quantity = 0
			if not name or quantity <= 0:
				return Response({'detail': 'Every cart item needs a valid product and quantity.'}, status=status.HTTP_400_BAD_REQUEST)
			requested[name.casefold()] = requested.get(name.casefold(), 0) + quantity

		items = list(InventoryItem.objects.filter(
			business=storefront.business, is_visible_on_storefront=True,
		))
		by_name = {item.product_name.casefold(): item for item in items}
		if len(by_name) != len(requested):
			return Response({'detail': 'One or more products are no longer available.'}, status=status.HTTP_409_CONFLICT)
		total = Decimal('0.00')
		validated_lines = []
		for normalized_name, quantity in requested.items():
			item = by_name[normalized_name]
			if item.selling_price is None or item.selling_price <= 0:
				return Response({'detail': f'{item.product_name} no longer has a valid price.'}, status=status.HTTP_409_CONFLICT)
			if item.qty_in_stock < quantity:
				return Response({'detail': f'Only {item.qty_in_stock} of {item.product_name} remain in stock.'}, status=status.HTTP_409_CONFLICT)
			total += item.selling_price * quantity
			validated_lines.append((item, quantity))

		with transaction.atomic():
			order = StorefrontOrder.objects.create(
				business=storefront.business, customer_name=customer_name,
				customer_phone=customer_phone, customer_address=customer_address,
				delivery_option=delivery_option,
				status=StorefrontOrder.STATUS_PENDING_PAYMENT if checkout_method == 'pay_now' else StorefrontOrder.STATUS_PENDING_WHATSAPP,
				total=total,
			)
			for item, quantity in validated_lines:
				StorefrontOrderLineItem.objects.create(order=order, inventory_item=item, quantity=quantity, unit_price=item.selling_price)

		if checkout_method == 'whatsapp':
			whatsapp_number = ''.join(character for character in storefront.whatsapp_number if character.isdigit())
			summary = '\n'.join(f'- {item.product_name} x {quantity} = N{item.selling_price * quantity:,.2f}' for item, quantity in validated_lines)
			message = f'Hello {storefront.business.name}, I would like to place an order.\n\n{summary}\n\nTotal: N{total:,.2f}\nName: {customer_name}\nPhone: {customer_phone}\nDelivery: {delivery_option}'
			return Response({'order_id': order.pk, 'whatsapp_url': f'https://wa.me/{whatsapp_number}?text={quote(message)}'})

		data = paystack_request('transaction/initialize', {
			'email': f'order-{order.pk}@orders.vendari.name.ng',
			'amount': int(total * 100), 'currency': 'NGN',
			'subaccount': storefront.business.paystack_subaccount_code,
			'bearer': 'subaccount',
			'metadata': {'payment_type': 'storefront_order', 'storefront_order_id': order.pk, 'business_id': storefront.business_id},
		}, method='POST')
		if not data or not data.get('status') or not data.get('data', {}).get('authorization_url'):
			return Response({'detail': 'Unable to initialize payment. Please try WhatsApp checkout instead.'}, status=status.HTTP_502_BAD_GATEWAY)
		order.paystack_reference = data['data'].get('reference')
		order.save(update_fields=('paystack_reference',))
		return Response({'order_id': order.pk, 'authorization_url': data['data']['authorization_url'], 'reference': order.paystack_reference})

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
