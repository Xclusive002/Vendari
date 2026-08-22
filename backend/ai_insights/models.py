from django.db import models


class AIInsight(models.Model):
    business = models.ForeignKey('businesses.Business', related_name='ai_insights', on_delete=models.CASCADE)
    insight_type = models.CharField(max_length=100)
    generated_at = models.DateTimeField(auto_now_add=True)
    payload = models.JSONField()
    summary_text = models.TextField()

    def __str__(self):
        return f'{self.business.name} - {self.insight_type}'
