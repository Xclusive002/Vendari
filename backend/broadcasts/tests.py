from unittest.mock import patch

from django.test import override_settings
from django.utils import timezone
from rest_framework import status
from rest_framework.test import APITestCase

from accounts.models import User

from .models import Broadcast, BroadcastRecipient


@override_settings(CRON_SECRET='broadcast-test-secret', VENDARI_LOGO_URL='https://res.cloudinary.com/vendari/image/upload/v1/vendari-logo.png')
class BroadcastCronTests(APITestCase):
    def setUp(self):
        self.users = [
            User.objects.create_user(f'broadcast-{index}@example.com', 'StrongPass123!', is_verified=True)
            for index in range(2)
        ]
        self.broadcast = Broadcast.objects.create(subject='A Vendari update', message_body='A useful message for every business.')
        BroadcastRecipient.objects.bulk_create([
            BroadcastRecipient(broadcast=self.broadcast, user=user)
            for user in self.users
        ])
        self.broadcast.total_recipients = 2
        self.broadcast.status = Broadcast.QUEUED
        self.broadcast.save(update_fields=('total_recipients', 'status'))

    def test_requires_cron_secret(self):
        response = self.client.post('/api/cron/send-broadcasts/', {}, format='json')
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    @patch('broadcasts.views.EmailMultiAlternatives')
    def test_sends_batch_and_marks_broadcast_sent(self, email_class):
        email = email_class.return_value
        email.send.return_value = 1
        response = self.client.post('/api/cron/send-broadcasts/', {'secret': 'broadcast-test-secret'}, format='json')

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['sent'], 2)
        self.assertEqual(response.data['remaining'], 0)
        self.broadcast.refresh_from_db()
        self.assertEqual(self.broadcast.status, Broadcast.SENT)
        self.assertEqual(self.broadcast.sent_count, 2)
        self.assertEqual(BroadcastRecipient.objects.filter(broadcast=self.broadcast, sent_at__isnull=False).count(), 2)
        self.assertEqual(email_class.call_count, 2)
        message = email_class.call_args_list[0].kwargs
        self.assertEqual(message['from_email'], 'Emmanuel from Vendari <emmanuel@vendari.name.ng>')
        html_body = email.attach_alternative.call_args_list[0].args[0]
        self.assertIn('res.cloudinary.com', html_body)
        self.assertIn('A useful message for every business.', html_body)

        second = self.client.post('/api/cron/send-broadcasts/', {'secret': 'broadcast-test-secret'}, format='json')
        self.assertEqual(second.data['processed'], 0)
        self.assertEqual(email_class.call_count, 2)

    @patch('broadcasts.views.EmailMultiAlternatives')
    def test_failed_recipient_is_retried_without_stopping_batch(self, email_class):
        email_class.return_value.send.side_effect = [RuntimeError('temporary'), 1]
        response = self.client.post('/api/cron/send-broadcasts/', {'secret': 'broadcast-test-secret'}, format='json')

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['failed'], 1)
        self.assertEqual(response.data['sent'], 1)
        self.assertEqual(BroadcastRecipient.objects.filter(broadcast=self.broadcast, sent_at__isnull=True).count(), 1)
        self.broadcast.refresh_from_db()
        self.assertEqual(self.broadcast.status, Broadcast.SENDING)
