import logging

from django.conf import settings
from django.core.mail import EmailMultiAlternatives

logger = logging.getLogger(__name__)


def send_storefront_published_email(user_email, business_name, storefront_url):
    if not user_email:
        return False
    try:
        from_email = getattr(settings, 'DEFAULT_FROM_EMAIL', '').strip() or 'onboarding@resend.dev'
        if from_email.lower().endswith('@gmail.com'):
            from_email = 'onboarding@resend.dev'
        dashboard_url = getattr(settings, 'DASHBOARD_URL', '').rstrip('/')
        subject = f'Congratulations, {business_name} storefront is live'
        text = (
            f'Congratulations, {business_name}!\n\n'
            f'Welcome to your new Vendari storefront. Your shop is now live:\n{storefront_url}\n\n'
            'Before sharing it widely:\n'
            '- Add products with clear descriptions, prices, stock quantities, and up to six useful photos.\n'
            '- Review your storefront theme, contact details, delivery options, and WhatsApp number.\n'
            '- Test the storefront link and place a test order so you know what your customers will see.\n'
            '- Keep inventory and prices current so customers receive accurate information.\n'
            '- Check your dashboard regularly for orders, sales, expenses, and low-stock alerts.\n\n'
            f'Open your dashboard: {dashboard_url}/dashboard\n\nWelcome aboard,\nThe Vendari team\n'
        )
        html = f'''<div style="font-family:Arial,sans-serif;line-height:1.6;color:#0B1220;max-width:620px;margin:auto;padding:24px">
<h1>Congratulations, {business_name}!</h1>
<p>Welcome to your new Vendari storefront. Your shop is now live.</p>
<p><a href="{storefront_url}">{storefront_url}</a></p>
<h2>Next steps</h2><ul>
<li>Add products with clear descriptions, prices, stock quantities, and up to six useful photos.</li>
<li>Review your theme, contact details, delivery options, and WhatsApp number.</li>
<li>Test the storefront link and place a test order.</li>
<li>Keep inventory and prices current.</li>
<li>Check your dashboard for orders, sales, expenses, and low-stock alerts.</li>
</ul><p><a href="{dashboard_url}/dashboard">Open your dashboard</a></p><p>Welcome aboard,<br>The Vendari team</p></div>'''
        message = EmailMultiAlternatives(subject=subject, body=text, from_email=from_email, to=[user_email])
        message.attach_alternative(html, 'text/html')
        message.send(fail_silently=False)
        return True
    except Exception:
        logger.exception('[STOREFRONT_EMAIL] Failed to send publish email to %s', user_email)
        return False