import hashlib
import hmac
import json
import logging
import urllib.error
import urllib.request
from datetime import timedelta
from decimal import Decimal, InvalidOperation

from django.conf import settings
from django.db import transaction
from django.http import HttpResponse
from django.utils import timezone
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView

from ai_insights.gemini import GeminiRateLimitError, generate_content, response_text
from businesses.models import Business
from customers.models import Customer
from inventory.models import InventoryItem
from sales.models import Sale
from sales.serializers import SaleSerializer
from vendari_api.rate_limits import rate_limited, too_many_requests

from .models import WhatsAppPendingAction

logger = logging.getLogger(__name__)


SUBSCRIBE_MESSAGE = 'Your Vendari trial or subscription has ended. Subscribe for N9,999/month to continue using Vendari: {url}/dashboard/settings/billing'


def normalize_phone(value):
    return ''.join(character for character in str(value or '') if character.isdigit())


def send_whatsapp_message(to, text):
    if not settings.WHATSAPP_ACCESS_TOKEN or not settings.WHATSAPP_PHONE_NUMBER_ID:
        logger.error('WhatsApp reply skipped because Meta credentials are not configured.')
        return False
    payload = json.dumps({
        'messaging_product': 'whatsapp',
        'to': normalize_phone(to),
        'type': 'text',
        'text': {'preview_url': False, 'body': text[:4096]},
    }).encode()
    request = urllib.request.Request(
        f'https://graph.facebook.com/v20.0/{settings.WHATSAPP_PHONE_NUMBER_ID}/messages',
        data=payload,
        headers={
            'Authorization': f'Bearer {settings.WHATSAPP_ACCESS_TOKEN}',
            'Content-Type': 'application/json',
        },
        method='POST',
    )
    try:
        with urllib.request.urlopen(request, timeout=15) as response:
            return 200 <= response.status < 300
    except (urllib.error.HTTPError, urllib.error.URLError):
        logger.exception('WhatsApp reply failed for phone=%s', to)
        return False


def download_whatsapp_media(media_id):
    metadata_request = urllib.request.Request(
        f'https://graph.facebook.com/v20.0/{media_id}',
        headers={'Authorization': f'Bearer {settings.WHATSAPP_ACCESS_TOKEN}'},
    )
    with urllib.request.urlopen(metadata_request, timeout=15) as metadata_response:
        metadata = json.loads(metadata_response.read())
    media_request = urllib.request.Request(
        metadata['url'],
        headers={'Authorization': f'Bearer {settings.WHATSAPP_ACCESS_TOKEN}'},
    )
    with urllib.request.urlopen(media_request, timeout=30) as media_response:
        return media_response.read(), metadata.get('mime_type', 'audio/ogg')


def get_message(payload):
    for entry in payload.get('entry', []):
        for change in entry.get('changes', []):
            for message in (change.get('value') or {}).get('messages', []):
                sender = normalize_phone(message.get('from'))
                if not sender:
                    continue
                if message.get('type') == 'text':
                    return sender, message.get('text', {}).get('body', '').strip(), None
                if message.get('type') in {'audio', 'voice'}:
                    media = message.get(message['type']) or {}
                    return sender, '', {'id': media.get('id'), 'mime_type': media.get('mime_type', 'audio/ogg')}
    return None, '', None


def classify_message(business, text='', audio=None):
    inventory = list(InventoryItem.objects.filter(business=business).values('product_name', 'qty_in_stock', 'cost_price', 'selling_price'))
    customers = list(Customer.objects.filter(business=business).values('name', 'phone', 'notes'))
    prompt = f'''Classify this WhatsApp business command and extract structured data. Return ONLY JSON.
Use one intent: sale, inventory, customer, or unclear.
For sale return product, quantity, price, customer_name, customer_phone, payment_method.
For inventory return product, quantity, cost_price, selling_price.
For customer return name, phone, notes.
Return unclear when the intent or required fields are not confident.
Current inventory: {json.dumps(inventory, default=str)}
Current customers: {json.dumps(customers, default=str)}
Text: {text}
JSON shape: {{"intent":"unclear", "product":"", "quantity":0, "price":null, "customer_name":"", "customer_phone":"", "payment_method":"", "cost_price":null, "selling_price":null, "name":"", "phone":"", "notes":""}}'''
    contents = prompt
    if audio:
        contents = [{'role': 'user', 'parts': [
            {'inline_data': {'mime_type': audio['mime_type'], 'data': audio['data']}},
            {'text': prompt},
        ]}]
    try:
        response = generate_content(contents, response_mime_type='application/json')
        result = json.loads(response_text(response))
    except (GeminiRateLimitError, json.JSONDecodeError, KeyError, TypeError, ValueError):
        logger.exception('WhatsApp Gemini classification failed for business=%s', business.pk)
        return {'intent': 'unclear'}
    return result if isinstance(result, dict) else {'intent': 'unclear'}


def clean_payload(intent, result):
    if intent == WhatsAppPendingAction.ACTION_SALE:
        product = str(result.get('product', '')).strip()
        quantity = result.get('quantity')
        if not product or not quantity:
            return None
        return {
            'product': product,
            'quantity': int(quantity),
            'price': result.get('price'),
            'customer_name': str(result.get('customer_name', '')).strip(),
            'customer_phone': normalize_phone(result.get('customer_phone')),
            'payment_method': str(result.get('payment_method', 'cash')).strip() or 'cash',
        }
    if intent == WhatsAppPendingAction.ACTION_INVENTORY:
        product = str(result.get('product', '')).strip()
        quantity = result.get('quantity')
        if not product or not quantity:
            return None
        return {'product': product, 'quantity': int(quantity), 'cost_price': result.get('cost_price'), 'selling_price': result.get('selling_price')}
    if intent == WhatsAppPendingAction.ACTION_CUSTOMER:
        name = str(result.get('name', '')).strip()
        phone = normalize_phone(result.get('phone'))
        if not name or not phone:
            return None
        return {'name': name, 'phone': phone, 'notes': str(result.get('notes', '')).strip()}
    return None


def summary_for(action_type, payload):
    if action_type == WhatsAppPendingAction.ACTION_SALE:
        customer = f" for {payload['customer_name']}" if payload.get('customer_name') else ''
        return f"I understood: record a sale of {payload['quantity']} x {payload['product']}{customer}, paid by {payload['payment_method']}."
    if action_type == WhatsAppPendingAction.ACTION_INVENTORY:
        return f"I understood: restock {payload['quantity']} x {payload['product']}."
    return f"I understood: add customer {payload['name']} with phone {payload['phone']}."


@transaction.atomic
def execute_pending_action(pending):
    business = Business.objects.select_for_update().get(pk=pending.business_id)
    payload = pending.payload
    if pending.action_type == WhatsAppPendingAction.ACTION_SALE:
        item = InventoryItem.objects.select_for_update().filter(business=business, product_name__iexact=payload['product']).first()
        if item is None:
            return 'I could not find that product in your inventory. No sale was saved.'
        customer = None
        if payload.get('customer_phone'):
            customer = Customer.objects.filter(business=business, phone=payload['customer_phone']).first()
        if customer is None and payload.get('customer_name'):
            customer = Customer.objects.filter(business=business, name__iexact=payload['customer_name']).first()
        serializer = SaleSerializer(data={
            'item': item.pk,
            'customer': customer.pk if customer else None,
            'quantity': payload['quantity'],
            'payment_method': payload['payment_method'],
        }, context={'business': business})
        serializer.is_valid(raise_exception=True)
        sale = serializer.save()
        pending.delete()
        return f'Sale saved: {sale.quantity} x {sale.product_name} for N{sale.total:,.2f}. Stock updated.'
    if pending.action_type == WhatsAppPendingAction.ACTION_INVENTORY:
        item = InventoryItem.objects.select_for_update().filter(business=business, product_name__iexact=payload['product']).first()
        if item is None:
            return 'I could not find that product in your inventory. No restock was saved.'
        item.qty_in_stock += int(payload['quantity'])
        update_fields = ['qty_in_stock', 'updated_at']
        for key in ('cost_price', 'selling_price'):
            if payload.get(key) is not None:
                try:
                    setattr(item, key, Decimal(str(payload[key])))
                    update_fields.append(key)
                except (InvalidOperation, TypeError, ValueError):
                    pass
        item.save(update_fields=update_fields)
        pending.delete()
        return f'Inventory updated: {item.product_name} now has {item.qty_in_stock} in stock.'
    customer, created = Customer.objects.get_or_create(
        business=business,
        phone=payload['phone'],
        defaults={'name': payload['name'], 'notes': payload.get('notes', '')},
    )
    if not created:
        customer.name = payload['name']
        if payload.get('notes'):
            customer.notes = payload['notes']
        customer.save(update_fields=['name', 'notes', 'updated_at'])
    pending.delete()
    return f"Customer {'added' if created else 'updated'}: {customer.name}, {customer.phone}."


class WhatsAppWebhookView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        mode = request.query_params.get('hub.mode')
        token = request.query_params.get('hub.verify_token')
        challenge = request.query_params.get('hub.challenge')
        if mode == 'subscribe' and token and settings.WHATSAPP_WEBHOOK_VERIFY_TOKEN and hmac.compare_digest(token, settings.WHATSAPP_WEBHOOK_VERIFY_TOKEN):
            return HttpResponse(challenge, content_type='text/plain')
        return Response({'error': 'Invalid verification token.'}, status=403)

    def post(self, request):
        signature = request.headers.get('X-Hub-Signature-256', '')
        expected = 'sha256=' + hmac.new(settings.WHATSAPP_APP_SECRET.encode(), request.body, hashlib.sha256).hexdigest()
        if not settings.WHATSAPP_APP_SECRET or not signature or not hmac.compare_digest(signature, expected):
            return Response({'error': 'Invalid signature.'}, status=403)
        try:
            payload = json.loads(request.body)
        except json.JSONDecodeError:
            return Response({'error': 'Invalid JSON payload.'}, status=400)
        sender, text, media = get_message(payload)
        if not sender:
            return Response({'status': 'ignored'})
        if rate_limited(request, 'whatsapp-webhook', limit=30, window=60, identifier=sender):
            return too_many_requests('Too many messages. Please try again later.')
        business = Business.objects.filter(whatsapp_number=sender).first()
        if business is None:
            send_whatsapp_message(sender, 'This WhatsApp number is not linked to a Vendari business. Add your number in Vendari Settings first.')
            return Response({'status': 'unlinked'})
        if not business.has_active_access:
            send_whatsapp_message(sender, SUBSCRIBE_MESSAGE.format(url=settings.DASHBOARD_URL.rstrip('/')))
            return Response({'status': 'subscription_required'})
        pending = WhatsAppPendingAction.objects.filter(business=business, phone_number=sender).first()
        command = text.lower().strip()
        if command in {'yes', 'confirm'} and pending:
            if pending.created_at < timezone.now() - timedelta(minutes=10):
                pending.delete()
                send_whatsapp_message(sender, 'That confirmation expired after 10 minutes. Please resend the command.')
                return Response({'status': 'expired'})
            try:
                reply = execute_pending_action(pending)
            except Exception:
                logger.exception('WhatsApp pending action failed for business=%s', business.pk)
                reply = 'I could not save that action. Please check the product details and try again.'
            send_whatsapp_message(sender, reply)
            return Response({'status': 'confirmed'})
        if command in {'no', 'cancel'} and pending:
            pending.delete()
            send_whatsapp_message(sender, 'Cancelled. Nothing was changed.')
            return Response({'status': 'cancelled'})
        if media and media.get('id'):
            try:
                audio_data, mime_type = download_whatsapp_media(media['id'])
                media = {'data': audio_data, 'mime_type': mime_type}
            except (KeyError, urllib.error.HTTPError, urllib.error.URLError):
                logger.exception('WhatsApp media download failed for business=%s', business.pk)
                send_whatsapp_message(sender, 'I could not download that voice note. Please send it again or type the command.')
                return Response({'status': 'media_error'})
        result = classify_message(business, text=text, audio=media)
        intent = result.get('intent')
        if intent not in {WhatsAppPendingAction.ACTION_SALE, WhatsAppPendingAction.ACTION_INVENTORY, WhatsAppPendingAction.ACTION_CUSTOMER}:
            send_whatsapp_message(sender, 'I could not tell whether you want to log a sale, restock inventory, or add a customer. Please give me a little more detail.')
            return Response({'status': 'unclear'})
        action_payload = clean_payload(intent, result)
        if action_payload is None:
            send_whatsapp_message(sender, 'I need a little more detail before I can prepare that. Include the product and quantity, or the customer name and phone.')
            return Response({'status': 'unclear'})
        WhatsAppPendingAction.objects.update_or_create(
            business=business,
            phone_number=sender,
            defaults={'action_type': intent, 'payload': action_payload},
        )
        send_whatsapp_message(sender, summary_for(intent, action_payload) + ' Reply YES to confirm or NO to cancel.')
        return Response({'status': 'pending'})
