from rest_framework import status
from rest_framework.test import APITestCase

from .models import User


class WelcomeStateTests(APITestCase):
	def test_new_users_start_unseen_and_can_mark_welcome_seen(self):
		user = User.objects.create_user('welcome@test.local', 'password123')
		self.assertFalse(user.has_seen_welcome)

		self.client.force_authenticate(user)
		response = self.client.post('/api/auth/mark-welcome-seen/')

		self.assertEqual(response.status_code, status.HTTP_200_OK)
		user.refresh_from_db()
		self.assertTrue(user.has_seen_welcome)
		self.assertEqual(self.client.post('/api/auth/mark-welcome-seen/').status_code, status.HTTP_200_OK)
