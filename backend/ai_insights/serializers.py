from rest_framework import serializers

from .models import AIInsight


class AIInsightSerializer(serializers.ModelSerializer):
    class Meta:
        model = AIInsight
        fields = ('id', 'insight_type', 'generated_at', 'payload', 'summary_text')