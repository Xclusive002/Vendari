import json
import logging
import urllib.error
import urllib.parse
import urllib.request
from datetime import timedelta
from decimal import Decimal, InvalidOperation

from django.conf import settings
from django.core.files.base import ContentFile
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


logger = logging.getLogger(__name__)


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

    def _download_meta_image(self, image_url, retailer_id):
        if not image_url or not str(image_url).startswith(('https://', 'http://')):
            return None
        try:
            image_request = urllib.request.Request(str(image_url), headers={'User-Agent': 'Vendari catalog import'})
            with urllib.request.urlopen(image_request, timeout=15) as response:
                image_data = response.read()
            if not image_data:
                return None
            return ContentFile(image_data, name=f'meta-{retailer_id}.jpg')
        except (urllib.error.HTTPError, urllib.error.URLError, ValueError):
            logger.warning('Meta product image download failed for retailer_id=%s', retailer_id)
            return None

    def _meta_request(self, path, params=None):
        query = urllib.parse.urlencode(params or {})
        separator = '&' if '?' in path else '?'
        request = urllib.request.Request(
            f'https://graph.facebook.com/v20.0/{path}{separator}{query}' if query else f'https://graph.facebook.com/v20.0/{path}',
            headers={'Authorization': f'Bearer {settings.WHATSAPP_ACCESS_TOKEN}'},
        )
        with urllib.request.urlopen(request, timeout=20) as response:
            return json.loads(response.read())

    @action(detail=False, methods=['get', 'post'], url_path='meta-sync')
    def meta_sync(self, request, business_pk=None):
        if not settings.WHATSAPP_ACCESS_TOKEN or not settings.WHATSAPP_BUSINESS_ACCOUNT_ID:
            return Response({'configured': False, 'detail': 'Meta catalog sync needs WHATSAPP_ACCESS_TOKEN and WHATSAPP_BUSINESS_ACCOUNT_ID configured on the server.'}, status=status.HTTP_200_OK)

        try:
            catalogs_response = self._meta_request(f'{settings.WHATSAPP_BUSINESS_ACCOUNT_ID}/product_catalogs', {'fields': 'id,name,product_count', 'limit': 100})
        except (urllib.error.HTTPError, urllib.error.URLError, ValueError):
            logger.exception('Meta catalog discovery failed for business=%s', business_pk)
            return Response({'configured': True, 'detail': 'Meta catalog access failed. Check the token and business account permissions.'}, status=status.HTTP_502_BAD_GATEWAY)

        catalogs = catalogs_response.get('data', [])
        if request.method == 'GET':
            return Response({'configured': True, 'catalogs': catalogs, 'selected_catalog_id': getattr(settings, 'WHATSAPP_CATALOG_ID', '')})

        catalog_id = str(request.data.get('catalog_id') or getattr(settings, 'WHATSAPP_CATALOG_ID', '') or '').strip()
        if not catalog_id:
            return Response({'configured': True, 'catalogs': catalogs, 'detail': 'Choose a Meta catalog before syncing.'}, status=status.HTTP_400_BAD_REQUEST)
        if not any(str(catalog.get('id')) == catalog_id for catalog in catalogs):
            return Response({'detail': 'That catalog is not available to this WhatsApp Business Account.'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            products_response = self._meta_request(f'{catalog_id}/products', {'fields': 'id,name,description,price,currency,availability,image_url,retailer_id', 'limit': 100})
        except (urllib.error.HTTPError, urllib.error.URLError, ValueError):
            logger.exception('Meta catalog product fetch failed for catalog=%s', catalog_id)
            return Response({'detail': 'Meta returned an error while reading this catalog.'}, status=status.HTTP_502_BAD_GATEWAY)

        imported = 0
        updated = 0
        skipped = 0
        next_url = products_response.get('paging', {}).get('next')
        product_pages = [products_response]
        while next_url and len(product_pages) < 10:
            try:
                next_request = urllib.request.Request(next_url, headers={'Authorization': f'Bearer {settings.WHATSAPP_ACCESS_TOKEN}'})
                with urllib.request.urlopen(next_request, timeout=20) as response:
                    page = json.loads(response.read())
                product_pages.append(page)
                next_url = page.get('paging', {}).get('next')
            except (urllib.error.HTTPError, urllib.error.URLError, ValueError):
                logger.exception('Meta catalog pagination failed for catalog=%s', catalog_id)
                break

        for page in product_pages:
            for product in page.get('data', []):
                product_name = str(product.get('name') or '').strip()
                retailer_id = str(product.get('retailer_id') or product.get('id') or '').strip()
                if not product_name or not retailer_id:
                    skipped += 1
                    continue
                try:
                    price = Decimal(str(product.get('price') or '0').replace(',', ''))
                except (InvalidOperation, ValueError):
                    price = Decimal('0')
                existing = self.get_queryset().filter(code=retailer_id).first()
                defaults = {'product_name': product_name, 'description': str(product.get('description') or ''), 'selling_price': price, 'cost_price': price * Decimal('0.55'), 'category': 'WhatsApp catalog'}
                image_file = self._download_meta_image(product.get('image_url'), retailer_id)
                if existing:
                    for field, value in defaults.items():
                        setattr(existing, field, value)
                    existing.save(update_fields=[*defaults.keys(), 'updated_at'])
                    if image_file:
                        existing.image.save(image_file.name, image_file, save=True)
                    updated += 1
                else:
                    created_item = InventoryItem.objects.create(business=self.business(), code=retailer_id, qty_in_stock=0, reorder_level=5, **defaults)
                    if image_file:
                        created_item.image.save(image_file.name, image_file, save=True)
                    imported += 1

        return Response({'configured': True, 'catalog_id': catalog_id, 'imported': imported, 'updated': updated, 'skipped': skipped, 'detail': f'Meta catalog sync complete: {imported} added, {updated} updated.'})

    @action(detail=False, methods=['post'], url_path='storefront-visibility')
    def storefront_visibility(self, request, business_pk=None):
        visible = request.data.get('visible')
        if not isinstance(visible, bool):
            return Response({'detail': 'visible must be a boolean.'}, status=status.HTTP_400_BAD_REQUEST)
        updated = self.get_queryset().update(is_visible_on_storefront=visible)
        return Response({'visible': visible, 'updated': updated})


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
