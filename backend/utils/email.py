import logging

import resend
from django.conf import settings

logger = logging.getLogger(__name__)


class VerificationEmailError(Exception):
    """Raised when Resend cannot deliver a verification email."""


def send_verification_email(to_email, verification_link_or_otp):
    resend.api_key = settings.RESEND_API_KEY
    try:
        resend.Emails.send({
            'from': settings.DEFAULT_FROM_EMAIL,
            'to': [to_email],
            'subject': 'Verify your Vendari email',
            'html': (
                '<p>Use this verification token to activate your Vendari account:</p>'
                f'<p><strong>{verification_link_or_otp}</strong></p>'
            ),
        })
    except Exception as error:
        logger.exception('Verification email failed for %s', to_email)
        raise VerificationEmailError('Unable to send verification email.') from error