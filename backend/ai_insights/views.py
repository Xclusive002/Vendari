import json
import logging
import tempfile
from decimal import Decimal

from django.conf import settings
from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView

from accounts.permissions import IsBusinessMember
from billing.utils import has_feature
from businesses.models import Business, Membership
from inventory.models import InventoryItem

from .models import AIInsight
from .serializers import AIInsightSerializer
from .query_service import answer_business_question
from .gemini import GeminiRateLimitError, generate_content, response_text

logger = logging.getLogger(__name__)


class BusinessInsightsView(APIView):
	permission_classes = [IsBusinessMember]

	def get(self, request, business_id):
		if not (
			Membership.objects.filter(user=request.user, business_id=business_id).exists()
			or Business.objects.filter(pk=business_id, owner=request.user).exists()
		):
			return Response({'detail': 'You must be a member of this business.'}, status=status.HTTP_403_FORBIDDEN)
		business = Business.objects.get(pk=business_id)
		if not has_feature(business, 'ai_insights'):
			return Response({'detail': 'AI insights are not enabled for this business plan.'}, status=status.HTTP_403_FORBIDDEN)
		insights = AIInsight.objects.filter(business=business).order_by('-generated_at')[:10]
		return Response(AIInsightSerializer(insights, many=True).data)


class BusinessAskView(APIView):
	permission_classes = [IsBusinessMember]

	def post(self, request, business_id):
		if not (
			Membership.objects.filter(user=request.user, business_id=business_id).exists()
			or Business.objects.filter(pk=business_id, owner=request.user).exists()
		):
			return Response({'detail': 'You must be a member of this business.'}, status=status.HTTP_403_FORBIDDEN)
		business = Business.objects.get(pk=business_id)
		if not has_feature(business, 'nl_reporting'):
			return Response({'detail': 'Natural-language reporting is not enabled for this business plan.'}, status=status.HTTP_403_FORBIDDEN)
		question = request.data.get('question', '').strip()
		if not question:
			return Response({'detail': 'Question is required.'}, status=status.HTTP_400_BAD_REQUEST)
		try:
			return Response(answer_business_question(business, question))
		except GeminiRateLimitError:
			return Response({'detail': 'AI is busy, try again in a moment.'}, status=status.HTTP_503_SERVICE_UNAVAILABLE)
		except Exception:
			return Response({'detail': 'Unable to answer this question right now.'}, status=status.HTTP_502_BAD_GATEWAY)


class VoiceEntryView(APIView):
	"""
	Process audio input via Gemini to extract structured data for Sales or Inventory.
	
	POST /api/businesses/{business_id}/voice-entry/
	Expected:
	  - audio: audio file (multipart)
	  - context: "sale" or "inventory"
	  
	For Sales: Extracts product_name (matched against InventoryItem.product_name),
	           quantity, and infers unit_price from selling_price
	For Inventory: Extracts product_name, quantity, cost_price, selling_price
	
	Returns: {"product_name": "...", "quantity": N, "unit_price": N, ...}
	or {"error": "couldn't understand"} on extraction failure
	"""
	permission_classes = [IsBusinessMember]

	def post(self, request, business_id):
		# Verify user is member or owner of business
		if not (
			Membership.objects.filter(user=request.user, business_id=business_id).exists()
			or Business.objects.filter(pk=business_id, owner=request.user).exists()
		):
			return Response({'detail': 'You must be a member of this business.'}, status=status.HTTP_403_FORBIDDEN)
		
		# Get business
		try:
			business = Business.objects.get(pk=business_id)
		except Business.DoesNotExist:
			return Response({'detail': 'Business not found.'}, status=status.HTTP_404_NOT_FOUND)
		if not has_feature(business, 'voice_entry'):
			return Response({'detail': 'Voice entry is available on a paid plan.'}, status=status.HTTP_403_FORBIDDEN)
		
		# Extract request parameters
		audio_file = request.FILES.get('audio')
		context = request.data.get('context', 'sale').strip().lower()
		
		if not audio_file:
			return Response({'detail': 'Audio file is required.'}, status=status.HTTP_400_BAD_REQUEST)
		
		if context not in ('sale', 'inventory'):
			return Response({'detail': 'Context must be "sale" or "inventory".'}, status=status.HTTP_400_BAD_REQUEST)
		
		try:
			logger.info(f'[VoiceEntry] Starting audio processing for business_id={business_id}, context={context}')
			
			# Read audio file into memory
			audio_data = audio_file.read()
			
			# Build extraction prompt based on context
			if context == 'sale':
				extraction_prompt = self._build_sale_extraction_prompt(business)
			else:
				extraction_prompt = self._build_inventory_extraction_prompt()
			
			logger.info(f'[VoiceEntry] Sending audio to Gemini for extraction (business_id={business_id})')
			
			# Call Gemini with audio file and extraction prompt
			response = generate_content(
				contents=[
					{
						'role': 'user',
						'parts': [
							{
								'inline_data': {
									'mime_type': audio_file.content_type or 'audio/wav',
									'data': audio_data,
								}
							},
							{'text': extraction_prompt}
						]
					}
				],
				response_mime_type='application/json'
			)
			
			# Parse response
			response_str = response_text(response)
			logger.info(f'[VoiceEntry] Gemini response: {response_str[:200]}')
			
			extracted = json.loads(response_str)
			
			# Validate and process extracted data
			if context == 'sale':
				result = self._process_sale_extraction(business, extracted)
			else:
				result = self._process_inventory_extraction(extracted)
			
			logger.info(f'[VoiceEntry] Successfully extracted fields: {result}')
			return Response(result, status=status.HTTP_200_OK)
			
		except GeminiRateLimitError:
			logger.warning(f'[VoiceEntry] Rate limit hit for business_id={business_id}')
			return Response({'error': 'AI service is busy, try again in a moment.'}, status=status.HTTP_503_SERVICE_UNAVAILABLE)
		except json.JSONDecodeError as e:
			logger.error(f'[VoiceEntry] JSON parse error for business_id={business_id}: {str(e)}')
			return Response({'error': 'couldn\'t understand'}, status=status.HTTP_200_OK)
		except Exception as e:
			logger.error(f'[VoiceEntry] Unexpected error for business_id={business_id}: {type(e).__name__}: {str(e)}')
			return Response({'error': 'couldn\'t understand'}, status=status.HTTP_200_OK)

	def _build_sale_extraction_prompt(self, business):
		"""Build extraction prompt for sales voice entry."""
		# Get available products for context
		products = InventoryItem.objects.filter(business=business).values_list('product_name', flat=True)
		product_list = ', '.join(products[:20]) if products.exists() else 'not available'
		
		return f"""You are an AI assistant helping to record a sale. Extract the following from the audio:
- product_name: The name of the product sold. Must be one of: {product_list}
- quantity: The number of units sold (integer)

Return ONLY a JSON object with these fields. If you can't extract both fields clearly, return an empty object {{}}.
Example response:
{{"product_name": "cement", "quantity": 5}}
"""

	def _build_inventory_extraction_prompt(self):
		"""Build extraction prompt for inventory voice entry."""
		return """You are an AI assistant helping to record inventory. Extract the following from the audio:
- product_name: The name of the product
- quantity: The number of units in stock (integer)
- cost_price: The cost per unit in naira (float)
- selling_price: The selling price per unit in naira (float)

Return ONLY a JSON object with these fields. If you can't extract a field clearly, omit it.
Example response:
{"product_name": "cement", "quantity": 100, "cost_price": 2000.50, "selling_price": 2500.00}
"""

	def _process_sale_extraction(self, business, extracted):
		"""Validate and process extracted sale data."""
		product_name = extracted.get('product_name', '').strip()
		quantity = extracted.get('quantity')
		
		if not product_name or not quantity:
			return {'error': 'couldn\'t understand'}
		
		try:
			quantity = int(quantity)
			if quantity <= 0:
				return {'error': 'couldn\'t understand'}
		except (ValueError, TypeError):
			return {'error': 'couldn\'t understand'}
		
		# Match product name against inventory
		try:
			item = InventoryItem.objects.get(
				business=business,
				product_name__iexact=product_name
			)
			return {
				'product_name': item.product_name,
				'item_id': item.id,
				'quantity': quantity,
				'unit_price': float(item.selling_price or 0),
				'estimated_total': quantity * float(item.selling_price or 0),
			}
		except InventoryItem.DoesNotExist:
			# Return anyway with extracted name; let frontend handle matching
			return {
				'product_name': product_name,
				'quantity': quantity,
				'error': 'Product not found in inventory'
			}

	def _process_inventory_extraction(self, extracted):
		"""Validate and process extracted inventory data."""
		product_name = extracted.get('product_name', '').strip()
		
		if not product_name:
			return {'error': 'couldn\'t understand'}
		
		result = {'product_name': product_name}
		
		# Process quantity
		if 'quantity' in extracted:
			try:
				result['quantity_in_stock'] = int(extracted['quantity'])
			except (ValueError, TypeError):
				pass
		
		# Process cost price
		if 'cost_price' in extracted:
			try:
				result['unit_cost'] = float(extracted['cost_price'])
			except (ValueError, TypeError):
				pass
		
		# Process selling price
		if 'selling_price' in extracted:
			try:
				result['selling_price'] = float(extracted['selling_price'])
			except (ValueError, TypeError):
				pass
		
		if len(result) == 1:  # Only product_name
			return {'error': 'couldn\'t understand'}
		
		return result
