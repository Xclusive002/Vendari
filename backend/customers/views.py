import hmac
import logging
from datetime import timedelta

from django.conf import settings
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
