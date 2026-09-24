import hmac
import logging
from urllib.parse import urlparse

from django.conf import settings
from django.core.mail import EmailMultiAlternatives
from django.db import transaction
from django.template.loader import render_to_string
from django.utils import timezone
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import Broadcast, BroadcastRecipient

logger = logging.getLogger(__name__)
BATCH_SIZE = 50
BROADCAST_FROM = 'Emmanuel from Vendari <emmanuel@vendari.name.ng>'


def send_broadcast_email(broadcast, recipient):
    logo_url = getattr(settings, 'VENDARI_LOGO_URL', '').strip()
    parsed_logo_url = urlparse(logo_url)
    if parsed_logo_url.scheme != 'https' or parsed_logo_url.netloc != 'res.cloudinary.com':
        raise ValueError('VENDARI_LOGO_URL must be an absolute HTTPS Cloudinary URL.')

    html_body = render_to_string('emails/broadcast.html', {
        'subject': broadcast.subject,
        'message_body': broadcast.message_body,
        'logo_url': logo_url,
    })
    email = EmailMultiAlternatives(
        subject=broadcast.subject,
        body=broadcast.message_body,
        from_email=BROADCAST_FROM,
        to=[recipient.user.email],
    )
    email.attach_alternative(html_body, 'text/html')
    email.send(fail_silently=False)


class BroadcastCronView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        expected_secret = str(getattr(settings, 'CRON_SECRET', '') or '')
        provided = str(
            request.data.get('secret')
            or request.headers.get('X-CRON-SECRET')
            or request.headers.get('X-Cron-Secret')
            or request.META.get('HTTP_X_CRON_SECRET')
            or ''
        )
        if not expected_secret or not provided or not hmac.compare_digest(provided, expected_secret):
            return Response({'detail': 'Unauthorized.'}, status=403)

        with transaction.atomic():
            broadcast = Broadcast.objects.select_for_update().filter(status__in=(Broadcast.QUEUED, Broadcast.SENDING)).order_by('created_at', 'pk').first()
            if broadcast is None:
                return Response({'status': 'ok', 'processed': 0, 'sent': 0, 'remaining': 0})
            broadcast.status = Broadcast.SENDING
            broadcast.save(update_fields=('status',))
            recipients = list(
                BroadcastRecipient.objects.select_related('user').filter(broadcast=broadcast, sent_at__isnull=True).order_by('pk')[:BATCH_SIZE]
            )

        sent = 0
        failed = 0
        for recipient in recipients:
            try:
                send_broadcast_email(broadcast, recipient)
            except Exception:
                failed += 1
                logger.exception('Broadcast email failed for broadcast=%s recipient=%s', broadcast.pk, recipient.user_id)
                continue
            recipient.sent_at = timezone.now()
            recipient.save(update_fields=('sent_at',))
            sent += 1

        with transaction.atomic():
            broadcast = Broadcast.objects.select_for_update().get(pk=broadcast.pk)
            sent_count = broadcast.recipients.filter(sent_at__isnull=False).count()
            remaining = broadcast.recipients.filter(sent_at__isnull=True).count()
            broadcast.sent_count = sent_count
            broadcast.status = Broadcast.SENT if remaining == 0 else Broadcast.SENDING
            broadcast.save(update_fields=('sent_count', 'status'))

        return Response({
            'status': broadcast.status,
            'broadcast_id': broadcast.pk,
            'processed': len(recipients),
            'sent': sent,
            'failed': failed,
            'remaining': remaining,
        })
