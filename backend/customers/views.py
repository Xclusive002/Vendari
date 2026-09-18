import hmac
import logging
from datetime import timedelta

from django.conf import settings
from django.core.cache import cache
from django.core.mail import EmailMultiAlternatives
from django.utils import timezone
from rest_framework import status, viewsets
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView

from accounts.permissions import IsBusinessMember
from businesses.models import Business, Membership
from invoices.models import Invoice

from .models import Customer, CustomerReminder
from .serializers import CustomerSerializer

logger = logging.getLogger(__name__)


def send_trial_reminder_email(business, days_left):
    if not business:
        return False
    recipient_email = str(getattr(business, 'email', '') or getattr(getattr(business, 'owner', None), 'email', '') or '').strip()
    if not recipient_email:
        return False

    try:
        from_email = getattr(settings, 'DEFAULT_FROM_EMAIL', '').strip() or 'onboarding@resend.dev'
        if from_email.lower().endswith('@gmail.com'):
            from_email = 'onboarding@resend.dev'
        dashboard_url = getattr(settings, 'DASHBOARD_URL', '').rstrip('/') or 'http://localhost:3000'
        pricing_url = f'{dashboard_url}/pricing'

        if days_left == 3:
            subject = f'{business.name}: 3 days left in your Vendari trial'
            headline = 'You still have time to unlock the full workflow.'
            callout = 'Three days left to set up your workspace, organize inventory, track sales, and keep customers engaged before your trial finishes.'
        elif days_left == 2:
            subject = f'{business.name}: 2 days left in your Vendari trial'
            headline = 'The next step is simple: keep momentum going.'
            callout = 'Two days remain to get your business systems in order. Move quickly and turn this free trial into a complete weekly operating rhythm.'
        else:
            subject = f'{business.name}: Your Vendari trial ends tomorrow'
            headline = 'Tomorrow is your last day to try Vendari.'
            callout = 'Use the final day to review your sales, inventory, invoices, and customer insights before your access pauses.'

        text = (
            f'Hi {business.name} owner,\n\n'
            f'{headline}\n\n'
            f'{callout}\n\n'
            'Your free trial is designed to help you test the essentials: sales tracking, inventory visibility, customer management, and daily operations in one place.\n\n'
            'If this feels like the right fit for your business, upgrade to Pro today and keep everything running smoothly.\n\n'
            f'Upgrade now: {pricing_url}\n'
            f'Open your dashboard: {dashboard_url}/dashboard\n\n'
            'Keep building. Keep growing. Keep the business organized with Vendari.\n\n'
            'The Vendari team'
        )
        html = f'''<div style="font-family:Arial,sans-serif;line-height:1.6;color:#0B1220;max-width:620px;margin:auto;padding:24px;background:#F7F9FC">
  <div style="background:#ffffff;border:1px solid #E3E8F1;border-radius:16px;padding:28px;box-shadow:0 10px 25px rgba(11,18,32,0.04)">
    <h1 style="margin:0 0 12px;font-size:28px;color:#06122B">{headline}</h1>
    <p style="margin:0 0 20px;color:#4B5768">{callout}</p>
    <p style="margin:0 0 16px;color:#0B1220">Your free trial is the perfect time to test how Vendari helps you stay on top of sales, stock, customers, and daily operations.</p>
    <p style="margin:0 0 16px;color:#0B1220">When you are ready to keep the momentum going, Pro gives you a more complete view of your business with a cleaner, calmer workflow.</p>
    <div style="margin:18px 0;padding:16px 18px;border-radius:12px;background:linear-gradient(135deg,#4683EC 0%,#4954F1 100%);color:#ffffff;font-weight:700;text-align:center">
      <a href="{pricing_url}" style="color:#ffffff;text-decoration:none">Upgrade to Pro today</a>
    </div>
    <p style="margin:0;color:#4B5768">Need a quick refresher? <a href="{dashboard_url}/dashboard" style="color:#4683EC;text-decoration:none">Open your dashboard</a> and keep your business moving.</p>
    <p style="margin:24px 0 0;color:#0B1220">Keep building. Keep growing. Keep the business organized with Vendari.</p>
    <p style="margin:8px 0 0;color:#4B5768">The Vendari team</p>
  </div>
</div>'''

        message = EmailMultiAlternatives(subject=subject, body=text, from_email=from_email, to=[recipient_email])
        message.attach_alternative(html, 'text/html')
        message.send(fail_silently=False)
        return True
    except Exception:
        logger.exception('[TRIAL_REMINDER_EMAIL] Failed for business_id=%s days_left=%s', getattr(business, 'pk', None), days_left)
        return False


def send_trial_expired_email(business):
    if not business:
        return False
    recipient_email = str(getattr(business, 'email', '') or getattr(getattr(business, 'owner', None), 'email', '') or '').strip()
    if not recipient_email:
        return False

    try:
        from_email = getattr(settings, 'DEFAULT_FROM_EMAIL', '').strip() or 'onboarding@resend.dev'
        if from_email.lower().endswith('@gmail.com'):
            from_email = 'onboarding@resend.dev'
        dashboard_url = getattr(settings, 'DASHBOARD_URL', '').rstrip('/') or 'http://localhost:3000'
        pricing_url = f'{dashboard_url}/pricing'
        subject = f'{business.name}: Your Vendari trial has ended'
        text = (
            f'Hi {business.name} owner,\n\n'
            'Your Vendari trial has ended, but the tools you need are still waiting for you.\n\n'
            'Access has paused until you subscribe, and the smartest next move is to keep your sales, inventory, customers, and daily operations in one clear system.\n\n'
            'Choose a Pro plan to continue managing your business without interruption.\n\n'
            f'Upgrade now: {pricing_url}\n'
            f'Open your dashboard: {dashboard_url}/dashboard\n\n'
            'You have already built momentum. Let Vendari help you keep it going.\n\n'
            'The Vendari team'
        )
        html = f'''<div style="font-family:Arial,sans-serif;line-height:1.6;color:#0B1220;max-width:620px;margin:auto;padding:24px;background:#F7F9FC">
  <div style="background:#ffffff;border:1px solid #E3E8F1;border-radius:16px;padding:28px;box-shadow:0 10px 25px rgba(11,18,32,0.04)">
    <h1 style="margin:0 0 12px;font-size:28px;color:#06122B">Your Vendari trial has ended</h1>
    <p style="margin:0 0 16px;color:#4B5768">The good news is you have already seen what Vendari can do for your business. Now it is time to keep the momentum going without interruption.</p>
    <p style="margin:0 0 16px;color:#0B1220">Your access is paused until you subscribe, but the workflow is ready for you to continue tracking sales, managing stock, and serving customers with more clarity.</p>
    <div style="margin:18px 0;padding:16px 18px;border-radius:12px;background:linear-gradient(135deg,#4683EC 0%,#4954F1 100%);color:#ffffff;font-weight:700;text-align:center">
      <a href="{pricing_url}" style="color:#ffffff;text-decoration:none">Resume your Pro plan</a>
    </div>
    <p style="margin:0;color:#4B5768">If you are ready to continue, <a href="{pricing_url}" style="color:#4683EC;text-decoration:none">review the plan</a> and get back to work without losing momentum.</p>
    <p style="margin:24px 0 0;color:#0B1220">You have already built the foundation. Keep going with Vendari.</p>
    <p style="margin:8px 0 0;color:#4B5768">The Vendari team</p>
  </div>
</div>'''

        message = EmailMultiAlternatives(subject=subject, body=text, from_email=from_email, to=[recipient_email])
        message.attach_alternative(html, 'text/html')
        message.send(fail_silently=False)
        return True
    except Exception:
        logger.exception('[TRIAL_EXPIRED_EMAIL] Failed for business_id=%s', getattr(business, 'pk', None))
        return False


def send_customer_reminder_email(customer, business, reminder_type, invoice=None):
    if not customer or not getattr(customer, 'email', ''):
        return False
    email = str(customer.email).strip()
    if not email:
        return False

    try:
        from_email = getattr(settings, 'DEFAULT_FROM_EMAIL', '').strip() or 'onboarding@resend.dev'
        if from_email.lower().endswith('@gmail.com'):
            from_email = 'onboarding@resend.dev'

        if reminder_type == CustomerReminder.REENGAGEMENT:
            subject = f'We miss you at {business.name}'
            body = (
                f'Hi {customer.name},\n\n'
                f'We miss you at {business.name}. We would love to welcome you back for your next order.\n\n'
                'If you have been thinking about your next purchase, we are ready to help and would love to see you again.\n\n'
                f'Visit us here: {settings.DASHBOARD_URL.rstrip("/")}/dashboard\n\n'
                'Warm regards,\n'
                f'{business.name}'
            )
            html = f'''<div style="font-family:Arial,sans-serif;line-height:1.6;color:#0B1220;max-width:620px;margin:auto;padding:24px"><h1>We miss you at {business.name}</h1><p>Hi {customer.name},</p><p>We would love to welcome you back for your next purchase.</p><p><a href="{settings.DASHBOARD_URL.rstrip('/')}/dashboard">Open your dashboard</a></p><p>Warm regards,<br>{business.name}</p></div>'''
        else:
            amount = invoice.total if invoice else 0
            due_phrase = invoice.due_date.strftime('%d %b %Y') if invoice and invoice.due_date else 'as soon as possible'
            subject = f'Payment reminder for {business.name}'
            body = (
                f'Hi {customer.name},\n\n'
                f'This is a friendly reminder that your invoice with {business.name} is still outstanding.\n\n'
                f'Amount due: N{amount:,.2f}\n'
                f'Due date: {due_phrase}\n\n'
                'Please send your payment at your earliest convenience so we can continue serving you.\n\n'
                'Warm regards,\n'
                f'{business.name}'
            )
            html = f'''<div style="font-family:Arial,sans-serif;line-height:1.6;color:#0B1220;max-width:620px;margin:auto;padding:24px"><h1>Payment reminder</h1><p>Hi {customer.name},</p><p>This is a friendly reminder that your invoice with {business.name} is still outstanding.</p><p><strong>Amount due:</strong> N{amount:,.2f}<br><strong>Due date:</strong> {due_phrase}</p><p>Please send your payment at your earliest convenience so we can continue serving you.</p><p>Warm regards,<br>{business.name}</p></div>'''

        message = EmailMultiAlternatives(subject=subject, body=body, from_email=from_email, to=[email])
        message.attach_alternative(html, 'text/html')
        message.send(fail_silently=False)
        return True
    except Exception:
        logger.exception('[CUSTOMER_REMINDER_EMAIL] Failed to send reminder to customer_id=%s business_id=%s', getattr(customer, 'pk', None), getattr(business, 'pk', None))
        return False


class CustomerReminderCronView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        expected_secret = str(getattr(settings, 'CRON_SECRET', '') or '')
        provided = str(request.data.get('secret') or request.headers.get('X-CRON-SECRET') or request.headers.get('X-Cron-Secret') or request.META.get('HTTP_X_CRON_SECRET') or '')
        if not expected_secret or not provided or not hmac.compare_digest(provided, expected_secret):
            return Response({'detail': 'Unauthorized.'}, status=status.HTTP_403_FORBIDDEN)

        now = timezone.now()
        sent = 0
        processed = 0

        for customer in Customer.objects.select_related('business').all():
            business = customer.business
            processed += 1
            if not customer.email or not str(customer.email).strip():
                continue
            if customer.days_since_last_purchase is not None and customer.days_since_last_purchase > 60:
                last_reengagement = CustomerReminder.objects.filter(
                    business=business,
                    customer=customer,
                    reminder_type=CustomerReminder.REENGAGEMENT,
                    sent_at__gte=now - timedelta(days=30),
                ).exists()
                if not last_reengagement:
                    if send_customer_reminder_email(customer, business, CustomerReminder.REENGAGEMENT):
                        CustomerReminder.objects.create(
                            business=business,
                            customer=customer,
                            reminder_type=CustomerReminder.REENGAGEMENT,
                            subject=f'We miss you at {business.name}',
                            email=customer.email,
                        )
                        sent += 1

            unpaid_invoices = list(Invoice.objects.filter(
                business=business,
                customer=customer,
                status=Invoice.UNPAID,
            ).order_by('-issue_date', '-due_date', '-id'))
            for invoice in unpaid_invoices:
                if not invoice.issue_date and not invoice.due_date:
                    continue
                invoice_age = (now.date() - (invoice.due_date or invoice.issue_date)).days if (invoice.due_date or invoice.issue_date) else 0
                if invoice_age < 7:
                    continue
                recent_payment_reminder = CustomerReminder.objects.filter(
                    business=business,
                    customer=customer,
                    reminder_type=CustomerReminder.PAYMENT,
                    related_invoice=invoice,
                    sent_at__gte=now - timedelta(days=30),
                ).exists()
                if recent_payment_reminder:
                    continue
                if send_customer_reminder_email(customer, business, CustomerReminder.PAYMENT, invoice=invoice):
                    CustomerReminder.objects.create(
                        business=business,
                        customer=customer,
                        reminder_type=CustomerReminder.PAYMENT,
                        subject=f'Payment reminder for {business.name}',
                        email=customer.email,
                        related_invoice=invoice,
                    )
                    sent += 1

        for business in Business.objects.filter(trial_ends_at__isnull=False).select_related('owner').order_by('pk'):
            if business.trial_ends_at and business.trial_ends_at > now:
                remaining_days = (business.trial_ends_at.date() - now.date()).days
                if remaining_days in {3, 2, 1}:
                    cache_key = f'trial-reminder:{business.pk}:{remaining_days}'
                    if cache.get(cache_key):
                        continue
                    if send_trial_reminder_email(business, remaining_days):
                        cache.set(cache_key, True, timeout=60 * 60 * 24 * 30)
                        sent += 1
            elif business.trial_ends_at and business.trial_ends_at <= now:
                cache_key = f'trial-reminder:{business.pk}:expired'
                if cache.get(cache_key):
                    continue
                if send_trial_expired_email(business):
                    cache.set(cache_key, True, timeout=60 * 60 * 24 * 30)
                    sent += 1

        return Response({'processed': processed, 'sent': sent, 'status': 'ok'})


class CustomerRemindersView(APIView):
    permission_classes = [IsBusinessMember]

    def get(self, request, business_id):
        reminders = CustomerReminder.objects.filter(business_id=business_id).select_related('customer', 'related_invoice').order_by('-sent_at')
        payload = []
        for reminder in reminders:
            payload.append({
                'id': reminder.pk,
                'customer_id': reminder.customer_id,
                'customer_name': reminder.customer.name,
                'reminder_type': reminder.reminder_type,
                'subject': reminder.subject,
                'email': reminder.email,
                'related_invoice_id': reminder.related_invoice_id,
                'related_invoice_number': reminder.related_invoice.doc_number if reminder.related_invoice else None,
                'sent_at': reminder.sent_at,
            })
        return Response(payload)


class CustomerViewSet(viewsets.ModelViewSet):
    serializer_class = CustomerSerializer
    permission_classes = [IsBusinessMember]

    def get_queryset(self):
        memberships = Membership.objects.filter(user=self.request.user).values('business_id')
        business_id = self.kwargs.get('business_pk', self.kwargs.get('business_id'))
        return Customer.objects.filter(business_id=business_id, business_id__in=memberships).select_related('business')

    def list(self, request, *args, **kwargs):
        queryset = self.filter_queryset(self.get_queryset())
        segment = request.query_params.get('segment')
        if segment:
            queryset = [customer for customer in queryset if getattr(customer, 'segment', None) == segment]
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)

    def perform_create(self, serializer):
        serializer.save(business=Business.objects.get(pk=self.kwargs.get('business_pk', self.kwargs.get('business_id'))))
