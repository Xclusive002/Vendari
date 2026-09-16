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


def send_team_invite_email(recipient_email, business_name, role, code):
    if not recipient_email:
        return False
    try:
        from_email = getattr(settings, 'DEFAULT_FROM_EMAIL', '').strip() or 'onboarding@resend.dev'
        if from_email.lower().endswith('@gmail.com'):
            from_email = 'onboarding@resend.dev'
        app_url = getattr(settings, 'DASHBOARD_URL', '').rstrip('/')
        invite_url = f'{app_url}/accept-invite?token={code}'
        subject = f'You have been invited to {business_name} on Vendari'
        text = (
            f'You have been invited to help manage {business_name} on Vendari.\n\n'
            f'Role: {role.title()}\n\n'
            f'Accept your invitation: {invite_url}\n\n'
            f'Your invitation code is: {code}\n\n'
            'Use the invited email address when accepting. If you are new to Vendari, create a password. '
            'If you already have a Vendari account, sign in with your existing account details. '
            'The invitation expires in 7 days and can only be used once.\n\n'
            'The Vendari team\n'
        )
        html = f'''<div style="font-family:Arial,sans-serif;line-height:1.6;color:#0B1220;max-width:620px;margin:auto;padding:24px">
<h1>You are invited to {business_name}</h1>
<p>You have been invited to help manage this business on Vendari.</p>
<p><strong>Role:</strong> {role.title()}</p>
<p><a href="{invite_url}" style="display:inline-block;background:#4683EC;color:white;padding:12px 18px;border-radius:8px;text-decoration:none;font-weight:600">Accept invitation</a></p>
<p>If the button does not work, use this invitation code: <strong>{code}</strong></p>
<p>Use the invited email address when accepting. New users will create a password; existing users can use their current account details. This invitation expires in 7 days and can only be used once.</p>
<p>The Vendari team</p></div>'''
        message = EmailMultiAlternatives(subject=subject, body=text, from_email=from_email, to=[recipient_email])
        message.attach_alternative(html, 'text/html')
        message.send(fail_silently=False)
        return True
    except Exception:
        logger.exception('[TEAM_INVITE_EMAIL] Failed to send invite to %s', recipient_email)
        return False


def send_storefront_sale_email(business, order):
    recipient_email = getattr(business.owner, 'email', '')
    if not recipient_email:
        return False
    try:
        from_email = getattr(settings, 'DEFAULT_FROM_EMAIL', '').strip() or 'onboarding@resend.dev'
        if from_email.lower().endswith('@gmail.com'):
            from_email = 'onboarding@resend.dev'
        items = list(order.line_items.select_related('inventory_item').all())
        summary = '\n'.join(f'- {line.inventory_item.product_name} x {line.quantity}' for line in items)
        html_summary = ''.join(f'<li>{line.inventory_item.product_name} x {line.quantity}</li>' for line in items)
        subject = f'Payment confirmed for storefront order #{order.pk}'
        text = (
            f'Payment confirmed for {business.name}.\n\n'
            f'Order: #{order.pk}\n{summary}\n\n'
            f'Amount: N{order.total:,.2f}\n\n'
            'The customer payment is confirmed. Your payout is pending and typically arrives within 1 business day.\n\n'
            'The Vendari team\n'
        )
        html = f'''<div style="font-family:Arial,sans-serif;line-height:1.6;color:#0B1220;max-width:620px;margin:auto;padding:24px"><h1>Payment confirmed</h1><p>A customer payment for {business.name} has been confirmed.</p><p><strong>Order:</strong> #{order.pk}</p><ul>{html_summary}</ul><p><strong>Amount:</strong> N{order.total:,.2f}</p><p style="padding:14px;border-radius:8px;background:#FFF7E6;color:#7A4B00"><strong>Payout pending:</strong> Your money typically arrives within 1 business day.</p><p>The Vendari team</p></div>'''
        message = EmailMultiAlternatives(subject, text, from_email, [recipient_email])
        message.attach_alternative(html, 'text/html')
        message.send(fail_silently=False)
        return True
    except Exception:
        logger.exception('[STOREFRONT_SALE_EMAIL] Failed for order=%s', getattr(order, 'pk', None))
        return False