from rest_framework import status
from rest_framework.test import APITestCase

from accounts.models import User
from businesses.models import Business, Membership

from .models import Notification, NotificationRead


class NotificationApiTests(APITestCase):
    def setUp(self):
        self.user_a = User.objects.create_user('a@notifications.local', 'password123')
        self.user_b = User.objects.create_user('b@notifications.local', 'password123')
        self.business_a = Business.objects.create(owner=self.user_a, name='A')
        self.business_b = Business.objects.create(owner=self.user_b, name='B')
        Membership.objects.create(user=self.user_a, business=self.business_a, role='owner')
        Membership.objects.create(user=self.user_b, business=self.business_b, role='owner')
        self.business_notification = Notification.objects.create(
            business=self.business_a, title='Business update', message='For business A only.', link='/dashboard',
        )
        self.other_business_notification = Notification.objects.create(
            business=self.business_b, title='Private update', message='For business B only.',
        )
        self.platform_notification = Notification.objects.create(
            title='Platform update', message='For every business.',
        )
        self.client.force_authenticate(self.user_a)
        self.url = '/api/notifications/'

    def test_notifications_are_scoped_to_business_and_platform_announcements(self):
        response = self.client.get(self.url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual({item['title'] for item in response.data}, {'Business update', 'Platform update'})
        self.assertFalse(next(item for item in response.data if item['title'] == 'Business update')['read'])

    def test_mark_read_creates_one_read_row_and_updates_response(self):
        url = f'{self.url}{self.business_notification.pk}/mark-read/'
        response = self.client.post(url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(NotificationRead.objects.filter(notification=self.business_notification, user=self.user_a).count(), 1)
        self.assertTrue(next(item for item in self.client.get(self.url).data if item['title'] == 'Business update')['read'])
        self.assertEqual(self.client.post(url).status_code, status.HTTP_200_OK)
        self.assertEqual(NotificationRead.objects.filter(notification=self.business_notification, user=self.user_a).count(), 1)

    def test_user_cannot_mark_other_business_notification_read(self):
        url = f'{self.url}{self.other_business_notification.pk}/mark-read/'

        self.assertEqual(self.client.post(url).status_code, status.HTTP_404_NOT_FOUND)
        self.assertFalse(NotificationRead.objects.filter(notification=self.other_business_notification, user=self.user_a).exists())
