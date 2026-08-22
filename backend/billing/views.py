import hashlib
import hmac
import json
import urllib.error
import urllib.request
from datetime import timedelta

from django.conf import settings
from django.db import transaction
from django.utils import timezone
from rest_framework import status
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView

from businesses.models import Business

from .models import Plan, Subscription
from .serializers import PaystackInitializeSerializer


class PaystackInitializeView(APIView):
    def post(self, request):
        serializer = PaystackInitializeSerializer(data=request.data, context={'request': request})
        serializer.is_valid(raise_exception=True)
        business = serializer.validated_data['business']
        plan = serializer.validated_data['plan']
        payload = json.dumps({
            'email': request.user.email,
            'amount': int(plan.amount * 100),
            'currency': 'NGN',
            'metadata': {'business_id': business.pk, 'plan_id': plan.pk},
        }).encode()
        paystack_request = urllib.request.Request(
            'https://api.paystack.co/transaction/initialize',
            data=payload,
            headers={
                'Authorization': f'Bearer {settings.PAYSTACK_SECRET_KEY}',
                'Content-Type': 'application/json',
            },
            method='POST',
        )
        try:
            with urllib.request.urlopen(paystack_request, timeout=15) as response:
                data = json.loads(response.read())
        except (urllib.error.URLError, json.JSONDecodeError):
            return Response({'error': 'Unable to initialize Paystack transaction.'}, status=status.HTTP_502_BAD_GATEWAY)
        if not data.get('status') or not data.get('data', {}).get('authorization_url'):
            return Response({'error': 'Paystack rejected the transaction.'}, status=status.HTTP_502_BAD_GATEWAY)
        return Response({
            'authorization_url': data['data']['authorization_url'],
            'reference': data['data'].get('reference'),
        })


class PaystackWebhookView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        signature = request.headers.get('X-Paystack-Signature', '')
        expected = hmac.new(
            settings.PAYSTACK_SECRET_KEY.encode(), request.body, hashlib.sha512,
        ).hexdigest()
        if not signature or not hmac.compare_digest(signature, expected):
            return Response({'error': 'Invalid signature.'}, status=status.HTTP_401_UNAUTHORIZED)
        try:
            payload = json.loads(request.body)
        except json.JSONDecodeError:
            return Response({'error': 'Invalid JSON payload.'}, status=status.HTTP_400_BAD_REQUEST)
        if payload.get('event') != 'charge.success':
            return Response({'status': 'ignored'})
        data = payload.get('data') or {}
        reference = data.get('reference')
        metadata = data.get('metadata') or {}
        business_id = metadata.get('business_id')
        plan_id = metadata.get('plan_id')
        if not reference or not business_id or not plan_id:
            return Response({'error': 'Missing payment metadata.'}, status=status.HTTP_400_BAD_REQUEST)
        with transaction.atomic():
            if Subscription.objects.filter(paystack_reference=reference).exists():
                return Response({'status': 'already_processed'})
            business = Business.objects.filter(pk=business_id).first()
            plan = Plan.objects.filter(pk=plan_id).first()
            if business is None or plan is None:
                return Response({'error': 'Invalid payment metadata.'}, status=status.HTTP_400_BAD_REQUEST)
            renew_days = 365 if plan.interval == plan.INTERVAL_YEARLY else 30
            subscription, _ = Subscription.objects.update_or_create(
                business=business,
                defaults={
                    'plan': plan,
                    'paystack_reference': reference,
                    'status': Subscription.STATUS_ACTIVE,
                    'renews_at': timezone.now() + timedelta(days=renew_days),
                },
            )
        return Response({'status': 'processed', 'subscription_id': subscription.pk})
