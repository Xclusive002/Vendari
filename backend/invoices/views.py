import json
from decimal import Decimal

from django.conf import settings
from django.db import transaction
from rest_framework import status, viewsets
from rest_framework.response import Response
from rest_framework.views import APIView

from accounts.permissions import IsBusinessMember
from businesses.models import Business, Membership
from sales.models import Sale
from ai_insights.gemini import GeminiRateLimitError, generate_content, response_text

from .models import Invoice, InvoiceLineItem
from .serializers import InvoiceSerializer


class InvoiceViewSet(viewsets.ModelViewSet):
    serializer_class = InvoiceSerializer
    permission_classes = [IsBusinessMember]

    def get_queryset(self):
        memberships = Membership.objects.filter(user=self.request.user).values('business_id')
        business_id = self.kwargs.get('business_pk', self.kwargs.get('business_id'))
        return Invoice.objects.filter(business_id=business_id, business_id__in=memberships).prefetch_related('line_items')

    def get_serializer_context(self):
        context = super().get_serializer_context()
        context['business'] = Business.objects.get(pk=self.kwargs.get('business_pk', self.kwargs.get('business_id')))
        return context

    def perform_create(self, serializer):
        serializer.save(business=Business.objects.get(pk=self.kwargs.get('business_pk', self.kwargs.get('business_id'))))


class GenerateInvoiceNotesView(APIView):
    permission_classes = [IsBusinessMember]

    def post(self, request, business_id):
        if not Membership.objects.filter(user=request.user, business_id=business_id).exists():
            return Response({'detail': 'You must be a member of this business.'}, status=status.HTTP_403_FORBIDDEN)

        if not settings.GEMINI_API_KEY:
            return Response({'detail': 'AI service not configured.'}, status=status.HTTP_503_SERVICE_UNAVAILABLE)

        description = request.data.get('description', '').strip()
        if not description:
            return Response({'detail': 'Description is required.'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            response = generate_content(
                description,
                system_instruction='''You are a professional invoice assistant. Extract structured invoice data from the user's description and return ONLY valid JSON, no markdown or extra text.

The user will describe goods/services to be invoiced. Extract:
1. line_items: array of objects with:
   - description: string (what was sold/provided)
   - quantity: number (how many units)
   - unit_price: number (price per unit, as a decimal)
2. notes: string (professional terms/payment terms paragraph, 2-3 sentences in the business owner's voice, professional tone, mentioning payment terms, due dates, or special conditions if applicable)

Return ONLY this JSON structure:
{
  "line_items": [
    {"description": "string", "quantity": 1, "unit_price": 1000}
  ],
  "notes": "Professional notes string"
}''',
                response_mime_type='application/json',
            )

            # Extract the text content from the response
            response_text_value = response_text(response)
            if not response_text_value:
                return Response({'detail': 'No response from AI service.'}, status=status.HTTP_502_BAD_GATEWAY)

            # Parse JSON from response
            try:
                result = json.loads(response_text_value)
            except json.JSONDecodeError:
                # Try to extract JSON from markdown code blocks
                if '```json' in response_text_value:
                    json_part = response_text_value.split('```json')[1].split('```')[0].strip()
                    result = json.loads(json_part)
                elif '```' in response_text_value:
                    json_part = response_text_value.split('```')[1].split('```')[0].strip()
                    result = json.loads(json_part)
                else:
                    return Response({'detail': 'Could not parse AI response.'}, status=status.HTTP_502_BAD_GATEWAY)

            # Validate structure
            if not isinstance(result.get('line_items'), list) or not result.get('notes'):
                return Response({'detail': 'Invalid response structure from AI.'}, status=status.HTTP_502_BAD_GATEWAY)

            # Validate and normalize line items
            validated_items = []
            for item in result['line_items']:
                try:
                    validated_items.append({
                        'description': str(item.get('description', ''))[:255],
                        'quantity': int(item.get('quantity', 1)),
                        'unit_price': float(item.get('unit_price', 0)),
                    })
                except (ValueError, TypeError):
                    pass

            if not validated_items:
                return Response({'detail': 'No valid line items extracted.'}, status=status.HTTP_400_BAD_REQUEST)

            return Response({
                'line_items': validated_items,
                'notes': str(result.get('notes', ''))[:2000],
            })

        except GeminiRateLimitError:
            return Response({'detail': 'AI is busy, try again in a moment.'}, status=status.HTTP_503_SERVICE_UNAVAILABLE)
        except Exception as e:
            return Response({'detail': 'Unable to generate invoice notes.'}, status=status.HTTP_502_BAD_GATEWAY)


class SaleReceiptView(APIView):
    permission_classes = [IsBusinessMember]

    @transaction.atomic
    def post(self, request, business_id, sale_id):
        sale = Sale.objects.filter(pk=sale_id, business_id=business_id).select_related('customer').first()
        if sale is None:
            return Response({'detail': 'Sale not found.'}, status=status.HTTP_404_NOT_FOUND)
        invoice = Invoice.objects.create(
            business_id=business_id,
            customer=sale.customer,
            doc_type=Invoice.RECEIPT,
            status=Invoice.PAID,
            linked_sale=sale,
            subtotal=sale.total,
            total=sale.total,
        )
        InvoiceLineItem.objects.create(
            invoice=invoice,
            description=sale.product_name,
            quantity=sale.quantity,
            unit_price=sale.unit_price,
        )
        return Response(InvoiceSerializer(invoice, context={'request': request, 'business': invoice.business}).data, status=status.HTTP_201_CREATED)
