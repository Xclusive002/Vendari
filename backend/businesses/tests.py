from datetime import timedelta
from io import BytesIO

from PIL import Image
from django.utils import timezone
from rest_framework import status
from rest_framework.test import APITestCase

from accounts.models import User

from inventory.models import InventoryItem

from .models import Business, ConciergeInquiry, Membership, StorefrontOrder, StorefrontSettings


def image_file():
	image = Image.new('RGB', (2, 2), 'blue')
	content = BytesIO()
	image.save(content, format='PNG')
	content.seek(0)
	from django.core.files.uploadedfile import SimpleUploadedFile
	return SimpleUploadedFile('logo.png', content.read(), content_type='image/png')


class BusinessProfileTests(APITestCase):
	def setUp(self):
		self.user = User.objects.create_user('business@test.local', 'password123')
		self.business = Business.objects.create(
			owner=self.user,
			name='Profile Business',
			trial_started_at=timezone.now(),
			trial_ends_at=timezone.now() + timedelta(days=5),
		)
		Membership.objects.create(user=self.user, business=self.business, role='owner')
		self.client.force_authenticate(self.user)

	def test_profile_is_incomplete_without_address_and_phone(self):
		self.assertFalse(self.business.has_complete_profile)
		self.business.address = '1 Main Street'
		self.business.phone = '08012345678'
		self.assertTrue(self.business.has_complete_profile)

	def test_multipart_profile_update_persists_logo_and_returns_absolute_url(self):
		response = self.client.patch(
			f'/api/businesses/{self.business.pk}/',
			{'address': '1 Main Street', 'phone': '08012345678', 'logo': image_file()},
			format='multipart',
		)

		self.assertEqual(response.status_code, status.HTTP_200_OK)
		self.assertTrue(response.data['logo'].startswith('http://testserver/media/business_logos/'))
		self.business.refresh_from_db()
		self.assertEqual(self.business.address, '1 Main Street')
		self.assertEqual(self.business.phone, '08012345678')
		self.assertTrue(self.business.logo.name.startswith('business_logos/'))

	def test_concierge_inquiry_is_publicly_saved(self):
		self.client.logout()
		response = self.client.post('/api/concierge-inquiries/', {
			'name': 'Emmanuel',
			'business_name': 'Test Shop',
			'phone': '08012345678',
			'interest': 'Website and Google Business Profile',
		}, format='json')
		self.assertEqual(response.status_code, status.HTTP_201_CREATED)
		self.assertTrue(ConciergeInquiry.objects.filter(business_name='Test Shop').exists())

	def test_storefront_launch_generates_unique_non_reserved_slug(self):
		store1 = StorefrontSettings.objects.create(business=self.business, slug='adeventures', is_published=True)
		self.assertEqual(store1.slug, 'adeventures')
		self.assertNotIn(store1.slug, StorefrontSettings.RESERVED_SLUGS)

		other_business = Business.objects.create(owner=self.user, name='Ade Ventures')
		other_store = StorefrontSettings.generate_for_business(other_business)
		self.assertNotEqual(other_store.slug, 'adeventures')
		self.assertTrue(other_store.slug.startswith('adeventures'))
		self.assertNotIn(other_store.slug, StorefrontSettings.RESERVED_SLUGS)

		reserved = StorefrontSettings.generate_for_business(Business.objects.create(owner=self.user, name='Admin Store'))
		self.assertNotEqual(reserved.slug, 'admin')

	def test_storefront_slug_endpoints_reject_reserved_and_taken_values(self):
		other_business = Business.objects.create(owner=self.user, name='Fresh Basket Co')
		StorefrontSettings.objects.create(business=other_business, slug='freshbasket', is_published=True)

		reserved_response = self.client.patch(
			f'/api/businesses/{self.business.pk}/storefront-settings/',
			{'slug': 'admin'},
			format='json',
		)
		self.assertEqual(reserved_response.status_code, status.HTTP_400_BAD_REQUEST)
		self.assertIn('slug', reserved_response.data)

		taken_response = self.client.patch(
			f'/api/businesses/{self.business.pk}/storefront-settings/',
			{'slug': 'freshbasket'},
			format='json',
		)
		self.assertEqual(taken_response.status_code, status.HTTP_400_BAD_REQUEST)
		self.assertIn('slug', taken_response.data)

	def test_check_slug_endpoint_returns_availability(self):
		self.client.logout()
		response = self.client.get('/api/storefronts/check-slug/?slug=admin')
		self.assertEqual(response.status_code, status.HTTP_200_OK)
		self.assertFalse(response.data['available'])

		response = self.client.get('/api/storefronts/check-slug/?slug=shopdelight')
		self.assertEqual(response.status_code, status.HTTP_200_OK)
		self.assertTrue(response.data['available'])

	def test_public_storefront_returns_visible_items_with_or_without_prices(self):
		storefront = StorefrontSettings.objects.create(business=self.business, slug='profilebusiness', is_published=True)
		visible = InventoryItem.objects.create(
			business=self.business, product_name='Visible', qty_in_stock=3, cost_price=10,
			selling_price=20, is_visible_on_storefront=True,
		)
		InventoryItem.objects.create(
			business=self.business, product_name='Hidden', qty_in_stock=3, cost_price=10,
			selling_price=20, is_visible_on_storefront=False,
		)
		InventoryItem.objects.create(
			business=self.business, product_name='Unpriced', qty_in_stock=3, cost_price=10,
			selling_price=None, is_visible_on_storefront=True,
		)

		self.client.logout()
		response = self.client.get(f'/api/storefronts/{storefront.slug}/')

		self.assertEqual(response.status_code, status.HTTP_200_OK)
		self.assertEqual(response.data['business_name'], self.business.name)
		self.assertEqual([item['product_name'] for item in response.data['items']], ['Unpriced', visible.product_name])
		self.assertEqual(set(response.data['items'][0]), {'product_name', 'description', 'image', 'selling_price', 'in_stock'})
		self.assertIsNone(response.data['items'][0]['selling_price'])

	def test_unpublished_or_unknown_storefront_is_not_publicly_discoverable(self):
		StorefrontSettings.objects.create(business=self.business, slug='hiddenstore', is_published=False)
		self.client.logout()
		self.assertEqual(self.client.get('/api/storefronts/hiddenstore/').status_code, status.HTTP_404_NOT_FOUND)
		self.assertEqual(self.client.get('/api/storefronts/does-not-exist/').status_code, status.HTTP_404_NOT_FOUND)

	def test_storefront_whatsapp_checkout_returns_prefilled_link(self):
		storefront = StorefrontSettings.objects.create(
			business=self.business, slug='profilebusiness', is_published=True,
			whatsapp_number='2348012345678',
		)
		InventoryItem.objects.create(
			business=self.business, product_name='Visible', qty_in_stock=3, cost_price=10,
			selling_price=20, is_visible_on_storefront=True,
		)
		self.client.logout()
		response = self.client.post(f'/api/storefronts/{storefront.slug}/checkout/', {
			'customer_name': 'Ada', 'customer_phone': '08012345678', 'delivery_option': 'pickup',
			'checkout_method': 'whatsapp', 'items': [{'product_name': 'Visible', 'quantity': 2}],
		}, format='json')
		self.assertEqual(response.status_code, status.HTTP_200_OK)
		self.assertIn('wa.me/2348012345678?text=', response.data['whatsapp_url'])
		self.assertEqual(StorefrontOrder.objects.get(pk=response.data['order_id']).status, StorefrontOrder.STATUS_PENDING_WHATSAPP)

	def test_pay_now_requires_payment_setup(self):
		storefront = StorefrontSettings.objects.create(business=self.business, slug='profilebusiness', is_published=True)
		self.client.logout()
		response = self.client.post(f'/api/storefronts/{storefront.slug}/checkout/', {
			'customer_name': 'Ada', 'customer_phone': '08012345678', 'delivery_option': 'pickup',
			'checkout_method': 'pay_now', 'items': [],
		}, format='json')
		self.assertEqual(response.status_code, status.HTTP_409_CONFLICT)
		self.assertIn('Pay Now', response.data['detail'])

# Create your tests here.
