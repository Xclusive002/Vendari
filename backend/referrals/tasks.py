from celery import shared_task
from django.utils import timezone

from .models import Commission


@shared_task
def approve_pending_commissions():
    now = timezone.now()
    updated = Commission.objects.filter(
        status=Commission.STATUS_PENDING,
        approve_after__lte=now,
    ).update(status=Commission.STATUS_APPROVED)
    return updated
