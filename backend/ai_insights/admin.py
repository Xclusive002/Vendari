from django.contrib import admin

from .models import AIInsight


@admin.register(AIInsight)
class AIInsightAdmin(admin.ModelAdmin):
    list_display = ('business', 'insight_type', 'generated_at', 'summary_text')
    list_filter = ('business', 'insight_type')
    search_fields = ('business__name', 'insight_type')
