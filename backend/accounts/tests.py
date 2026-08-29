import importlib
from unittest.mock import patch

from django.conf import settings
from django.core.mail import EmailMultiAlternatives
from rest_framework import status
from rest_framework.test import APITestCase

from vendari_api.resend_backend import ResendBackend
from .models import User
from .views import send_welcome_email


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

	@patch('django.core.mail.EmailMultiAlternatives.send', return_value=1)
	def test_welcome_email_uses_html_alternative_and_sends(self, mock_send):
		with self.settings(DEFAULT_FROM_EMAIL='hello@vendari.name.ng', RESEND_API_KEY='test_key', DASHBOARD_URL='https://dashboard.vendari.app'):
			result = send_welcome_email('new-owner@example.com', 'Bluebird Market')

		self.assertTrue(result)
		mock_send.assert_called_once()

	@patch('vendari_api.resend_backend.Resend')
	def test_resend_backend_sends_html_alternative(self, mock_resend_cls):
		mock_client = mock_resend_cls.return_value
		message = EmailMultiAlternatives(
			subject='Welcome',
			body='Plain text body',
			from_email='hello@vendari.name.ng',
			to=['new-owner@example.com'],
		)
		message.attach_alternative('<p>HTML body</p>', 'text/html')

		with self.settings(RESEND_API_KEY='test_key', DEFAULT_FROM_EMAIL='hello@vendari.name.ng'):
			result = ResendBackend().send_messages([message])

		self.assertEqual(result, 1)
		mock_client.emails.send.assert_called_once()
		payload = mock_client.emails.send.call_args[0][0]
		self.assertEqual(payload['html'], '<p>HTML body</p>')
		self.assertEqual(payload['text'], 'Plain text body')


class EmailAndDatabaseConfigTests(APITestCase):
	def test_email_backend_is_resend_only(self):
		project_settings = importlib.import_module('vendari_api.settings')
		self.assertEqual(project_settings.EMAIL_BACKEND, 'vendari_api.resend_backend.ResendBackend')
		self.assertNotEqual(project_settings.EMAIL_BACKEND, 'django.core.mail.backends.smtp.EmailBackend')

	def test_db_connection_reuse_is_enabled(self):
		self.assertEqual(settings.DATABASES['default']['CONN_MAX_AGE'], 60)
