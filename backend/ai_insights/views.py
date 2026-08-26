from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView

from accounts.permissions import IsBusinessMember
from billing.utils import has_feature
from businesses.models import Business, Membership

from .models import AIInsight
from .serializers import AIInsightSerializer
from .query_service import answer_business_question
from .gemini import GeminiRateLimitError


class BusinessInsightsView(APIView):
	permission_classes = [IsBusinessMember]

	def get(self, request, business_id):
		if not Membership.objects.filter(user=request.user, business_id=business_id).exists():
			return Response({'detail': 'You must be a member of this business.'}, status=status.HTTP_403_FORBIDDEN)
		business = Business.objects.get(pk=business_id)
		if not has_feature(business, 'ai_insights'):
			return Response({'detail': 'AI insights are not enabled for this business plan.'}, status=status.HTTP_403_FORBIDDEN)
		insights = AIInsight.objects.filter(business=business).order_by('-generated_at')[:10]
		return Response(AIInsightSerializer(insights, many=True).data)


class BusinessAskView(APIView):
	permission_classes = [IsBusinessMember]

	def post(self, request, business_id):
		if not Membership.objects.filter(user=request.user, business_id=business_id).exists():
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
