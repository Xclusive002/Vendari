import logging

import requests
from django.conf import settings
from django.core.mail.backends.base import BaseEmailBackend

logger = logging.getLogger(__name__)


class ResendBackend(BaseEmailBackend):
    """Django email backend that sends mail via Resend and never falls back to SMTP."""

    def send_messages(self, email_messages):
        if not email_messages:
            return 0

        sent = 0
        for message in email_messages:
            if not message.recipients():
                continue

            try:
                api_key = getattr(settings, 'RESEND_API_KEY', '').strip()
                from_email = (message.from_email or getattr(settings, 'DEFAULT_FROM_EMAIL', '')).strip()
                if not api_key:
                    raise ValueError('RESEND_API_KEY is not configured.')
                if not from_email:
                    raise ValueError('DEFAULT_FROM_EMAIL is not configured.')

                html_body = message.body
                if getattr(message, 'alternatives', None):
                    for content, mime_type in message.alternatives:
                        if mime_type.lower() == 'text/html':
                            html_body = content
                            break

                payload = {
                    'from': from_email,
                    'to': list(message.to),
                    'subject': message.subject,
                    'text': message.body,
                }
                if html_body:
                    payload['html'] = html_body

                logger.info('[RESEND_BACKEND] Sending email via Resend: from=%s to=%s subject=%s', from_email, message.to, message.subject)
                response = requests.post(
                    'https://api.resend.com/emails',
                    headers={
                        'Authorization': f'Bearer {api_key}',
                        'Content-Type': 'application/json',
                    },
                    json=payload,
                    timeout=30,
                )
                response.raise_for_status()
                sent += 1
            except Exception:
                logger.exception('[RESEND_BACKEND] Email send failed for %s', list(message.to))
                if self.fail_silently:
                    continue
                raise

        return sent
