from datetime import timedelta
from io import BytesIO
from unittest.mock import patch

from PIL import Image
from django.utils import timezone
from rest_framework import status
from rest_framework.test import APITestCase

from accounts.models import User

from inventory.models import InventoryItem
from billing.models import Plan

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
		self.assertEqual(set(response.data['items'][0]), {'id', 'product_name', 'description', 'image', 'images', 'selling_price', 'in_stock'})
		self.assertIsNone(response.data['items'][0]['selling_price'])

	def test_storefront_social_links_persist_and_validate(self):
		response = self.client.patch(
			f'/api/businesses/{self.business.pk}/storefront-settings/',
			{'social_links': {
				'instagram': 'https://instagram.com/profilebusiness',
				'facebook': 'https://facebook.com/profilebusiness',
				'tiktok': '',
				'twitter': '',
			}},
			format='json',
		)
		self.assertEqual(response.status_code, status.HTTP_200_OK)
		self.assertEqual(response.data['social_links']['instagram'], 'https://instagram.com/profilebusiness')
		self.assertEqual(response.data['social_links']['facebook'], 'https://facebook.com/profilebusiness')
		self.assertEqual(response.data['social_links']['tiktok'], '')
		self.assertEqual(response.data['social_links']['twitter'], '')

		storefront = StorefrontSettings.objects.get(business=self.business)
		storefront.is_published = True
		storefront.save(update_fields=['is_published'])
		self.client.logout()
		public_response = self.client.get(f'/api/storefronts/{storefront.slug}/')
		self.assertEqual(public_response.status_code, status.HTTP_200_OK)
		self.assertEqual(public_response.data['storefront']['social_links'], response.data['social_links'])

		self.client.force_authenticate(self.user)
		invalid_response = self.client.patch(
			f'/api/businesses/{self.business.pk}/storefront-settings/',
			{'social_links': {'instagram': 'instagram.com/profilebusiness'}},
			format='json',
		)
		self.assertEqual(invalid_response.status_code, status.HTTP_400_BAD_REQUEST)
		self.assertIn('instagram', invalid_response.data['social_links'])

	def test_storefront_theme_and_colors_persist_to_public_response(self):
		response = self.client.patch(
			f'/api/businesses/{self.business.pk}/storefront-settings/',
			{'theme': 'bold', 'primary_color': '#123456', 'accent_color': '#F97316'},
			format='json',
		)
		self.assertEqual(response.status_code, status.HTTP_200_OK)
		self.assertEqual(response.data['theme'], 'bold')
		self.assertEqual(response.data['primary_color'], '#123456')
		self.assertEqual(response.data['accent_color'], '#F97316')

		storefront = StorefrontSettings.objects.get(business=self.business)
		storefront.is_published = True
		storefront.save(update_fields=['is_published'])
		self.client.logout()
		public_response = self.client.get(f'/api/storefronts/{storefront.slug}/')
		self.assertEqual(public_response.data['storefront']['theme'], 'bold')
		self.assertEqual(public_response.data['storefront']['primary_color'], '#123456')
		self.assertEqual(public_response.data['storefront']['accent_color'], '#F97316')

	@patch('businesses.views.send_storefront_published_email', return_value=True)
	def test_publishing_storefront_sends_owner_onboarding_email_once(self, send_email):
		StorefrontSettings.objects.create(business=self.business, slug='publishbusiness', is_published=False)
		self.client.patch(
			f'/api/businesses/{self.business.pk}/storefront-settings/',
			{'is_published': True},
			format='json',
		)
		send_email.assert_called_once_with(
			self.user.email,
			self.business.name,
			'https://www.vendari.name.ng/s/publishbusiness',
		)
		self.client.patch(
			f'/api/businesses/{self.business.pk}/storefront-settings/',
			{'is_published': True},
			format='json',
		)
		self.assertEqual(send_email.call_count, 1)

	def test_public_storefront_includes_business_logo_and_banner_urls(self):
		storefront = StorefrontSettings.objects.create(
			business=self.business,
			slug='profilebusiness',
			is_published=True,
			banner_image=image_file(),
		)
		self.business.logo = image_file()
		self.business.save(update_fields=['logo'])

		self.client.logout()
		response = self.client.get(f'/api/storefronts/{storefront.slug}/')

		self.assertEqual(response.status_code, status.HTTP_200_OK)
		self.assertTrue(response.data['storefront']['logo'].startswith('http://testserver/media/business_logos/'))
		self.assertTrue(response.data['storefront']['banner_image'].startswith('http://testserver/media/storefront_banners/'))

	def test_public_storefront_product_detail_enforces_visibility_and_business(self):
		storefront = StorefrontSettings.objects.create(business=self.business, slug='profilebusiness', is_published=True)
		visible = InventoryItem.objects.create(
			business=self.business, product_name='Visible', qty_in_stock=3, cost_price=10,
			selling_price=20, is_visible_on_storefront=True, description='Full description',
		)
		out_of_stock = InventoryItem.objects.create(
			business=self.business, product_name='Out of stock', qty_in_stock=0, cost_price=10,
			selling_price=20, is_visible_on_storefront=True,
		)
		hidden = InventoryItem.objects.create(
			business=self.business, product_name='Hidden', qty_in_stock=3, cost_price=10,
			selling_price=20, is_visible_on_storefront=False,
		)
		unpriced = InventoryItem.objects.create(
			business=self.business, product_name='Unpriced', qty_in_stock=3, cost_price=10,
			selling_price=None, is_visible_on_storefront=True,
		)
		other_business = Business.objects.create(owner=self.user, name='Other Business')
		other = InventoryItem.objects.create(
			business=other_business, product_name='Other', qty_in_stock=3, cost_price=10,
			selling_price=20, is_visible_on_storefront=True,
		)

		self.client.logout()
		response = self.client.get(f'/api/storefronts/{storefront.slug}/products/{visible.pk}/')
		self.assertEqual(response.status_code, status.HTTP_200_OK)
		self.assertEqual(response.data['product']['product_name'], 'Visible')
		self.assertEqual(response.data['product']['description'], 'Full description')
		self.assertNotIn('cost_price', response.data['product'])
		out_of_stock_response = self.client.get(f'/api/storefronts/{storefront.slug}/products/{out_of_stock.pk}/')
		self.assertEqual(out_of_stock_response.status_code, status.HTTP_200_OK)
		self.assertFalse(out_of_stock_response.data['product']['in_stock'])
		for item in (hidden, unpriced, other):
			self.assertEqual(self.client.get(f'/api/storefronts/{storefront.slug}/products/{item.pk}/').status_code, status.HTTP_404_NOT_FOUND)

	@patch('businesses.views.send_team_invite_email', return_value=True)
	def test_team_invite_emails_recipient_and_acceptance_returns_tokens(self, send_email):
		plan = Plan.objects.create(name=Plan.PLAN_PRO, interval=Plan.INTERVAL_MONTHLY, feature_flags={'team_members': True})
		self.business.plan = plan
		self.business.save(update_fields=['plan'])
		self.client.force_authenticate(self.user)
		response = self.client.post(
			f'/api/businesses/{self.business.pk}/members/',
			{'email': 'staff@example.com', 'role': 'staff'},
			format='json',
		)
		self.assertEqual(response.status_code, status.HTTP_201_CREATED)
		send_email.assert_called_once_with('staff@example.com', self.business.name, 'staff', response.data['code'])

		self.client.logout()
		accepted = self.client.post('/api/auth/accept-invite/', {
			'token': response.data['code'], 'email': 'staff@example.com', 'password': 'StrongPass123!',
		}, format='json')
		self.assertEqual(accepted.status_code, status.HTTP_201_CREATED)
		self.assertIn('access', accepted.data)
		self.assertEqual(accepted.data['role'], 'staff')

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
