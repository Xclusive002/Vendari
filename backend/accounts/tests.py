import importlib
from unittest.mock import patch

from django.conf import settings
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

	@patch('accounts.views.send_welcome_email')
	def test_registration_attempts_welcome_email_immediately(self, mock_send_welcome_email):
		response = self.client.post('/api/auth/register/', {
			'email': 'new-owner@example.com',
			'password': 'StrongPass123!',
			'business_name': 'Bluebird Market',
		}, format='json')

		self.assertEqual(response.status_code, status.HTTP_201_CREATED)
		mock_send_welcome_email.assert_called_once_with('new-owner@example.com', 'Bluebird Market')


class EmailAndDatabaseConfigTests(APITestCase):
	def test_email_backend_is_resend_only(self):
		project_settings = importlib.import_module('vendari_api.settings')
		self.assertEqual(project_settings.EMAIL_BACKEND, 'vendari_api.resend_backend.ResendBackend')
		self.assertNotEqual(project_settings.EMAIL_BACKEND, 'django.core.mail.backends.smtp.EmailBackend')

	def test_db_connection_reuse_is_enabled(self):
		self.assertEqual(settings.DATABASES['default']['CONN_MAX_AGE'], 60)
