from django.core.mail.backends.base import BaseEmailBackend


class ResendBackend(BaseEmailBackend):
    """Django email backend that sends mail via Resend and never falls back to SMTP.

    This project explicitly requires all outgoing mail to be sent through the Resend
    API, so any default SMTP backend configuration is intentionally disabled by
    configuration and this backend remains the single entry point for mail delivery.
    """

    def send_messages(self, email_messages):
        if not email_messages:
            return 0

        sent = 0
        for message in email_messages:
            if not message.recipients():
                continue

            try:
                from resend import Resend

                api_key = __import__('django.conf').conf.settings.RESEND_API_KEY
                if not api_key:
                    raise ValueError('RESEND_API_KEY is not configured.')

                client = Resend(api_key=api_key)
                client.emails.send(
                    {
                        'from': message.from_email or __import__('django.conf').conf.settings.DEFAULT_FROM_EMAIL,
                        'to': list(message.to),
                        'subject': message.subject,
                        'html': message.alternatives[0][0] if message.alternatives else message.body,
                        'text': message.body,
                    }
                )
                sent += 1
            except Exception:
                if self.fail_silently:
                    continue
                raise

        return sent
