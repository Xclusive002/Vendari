from io import BytesIO

from PIL import Image
from rest_framework import status
from rest_framework.test import APITestCase

from accounts.models import User

from .models import Business, ConciergeInquiry, Membership


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
		self.business = Business.objects.create(owner=self.user, name='Profile Business')
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

# Create your tests here.
