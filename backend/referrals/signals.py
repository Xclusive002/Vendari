from datetime import timedelta
from decimal import Decimal

from django.conf import settings
from django.db import IntegrityError, transaction
from django.dispatch import receiver
from django.utils import timezone

from billing.models import membership_payment_refunded, membership_payment_succeeded

from .fraud import flag_quick_refund
from .models import Commission, Referral, _is_within_commission_window, _referrer_converted_count, _tier_percent_for_count


@receiver(membership_payment_succeeded)
def handle_membership_payment_succeeded(sender, payment, **kwargs):
    if not payment or not payment.user:
        return

    try:
        with transaction.atomic():
            referral = Referral.objects.select_for_update().select_related(
                'referrer',
                'referred_user',
            ).filter(referred_user=payment.user).first()
            if referral is None or referral.status == Referral.STATUS_REJECTED:
                return

            if Commission.objects.filter(payment_reference=payment.reference).exists():
                return
            payment_time = payment.paid_at or timezone.now()
            if referral.first_paid_at is None:
                if not _is_within_commission_window(payment_time, timezone.now()):
                    return
                referral.first_paid_at = payment_time
                referral.status = Referral.STATUS_CONVERTED
                referral.converted_at = payment_time
                referral.save(update_fields=['status', 'first_paid_at', 'converted_at'])
            elif not _is_within_commission_window(referral.first_paid_at, payment_time):
                return

            if payment.amount is None or Decimal(str(payment.amount)) <= 0:
                return

            eligible_statuses = [
                Commission.STATUS_PENDING,
                Commission.STATUS_APPROVED,
                Commission.STATUS_PAID,
            ]
            existing_commissions = Commission.objects.filter(
                referral=referral,
                status__in=eligible_statuses,
            )
            if payment.interval == 'yearly' and existing_commissions.exists():
                return
            if payment.interval == 'monthly' and existing_commissions.count() >= 12:
                return

            rate_percent = _tier_percent_for_count(_referrer_converted_count(referral.referrer))
            if rate_percent <= 0:
                return

            gross_amount = int((Decimal(str(payment.amount)) * Decimal('100')).quantize(Decimal('1')))
            paystack_fee = int((Decimal(str(payment.fee)) * Decimal('100')).quantize(Decimal('1')))
            net_amount = max(gross_amount - paystack_fee, 0)
            if net_amount <= 0:
                return

            amount = int((Decimal(net_amount) * Decimal(rate_percent) / Decimal('100')).to_integral_value())
            if amount <= 0:
                return

            Commission.objects.create(
                referral=referral,
                referrer=referral.referrer,
                payment_reference=payment.reference,
                gross_amount=gross_amount,
                paystack_fee=paystack_fee,
                net_amount=net_amount,
                rate_percent=rate_percent,
                amount=amount,
                status=Commission.STATUS_PENDING,
                approve_after=timezone.now() + timedelta(days=settings.REFERRAL_SETTINGS.get('HOLD_DAYS', 14)),
            )
    except IntegrityError:
        if Commission.objects.filter(payment_reference=payment.reference).exists():
            return
        raise


@receiver(membership_payment_refunded)
def handle_membership_payment_refunded(sender, payment, **kwargs):
    if not payment or not payment.user:
        return

    flag_quick_refund(payment.user, payment)
    try:
        with transaction.atomic():
            commission_qs = Commission.objects.select_for_update().filter(
                referral__referred_user=payment.user,
                payment_reference=payment.reference,
            )
            for commission in commission_qs:
                if commission.status in [Commission.STATUS_PENDING, Commission.STATUS_APPROVED]:
                    commission.status = Commission.STATUS_REVERSED
                    commission.reversed_reason = 'Membership payment refunded'
                    commission.save(update_fields=['status', 'reversed_reason'])
                elif commission.status == Commission.STATUS_PAID:
                    adjustment_reference = f'{payment.reference}-refund'
                    if Commission.objects.filter(payment_reference=adjustment_reference).exists():
                        continue
                    Commission.objects.create(
                        referral=commission.referral,
                        referrer=commission.referrer,
                        payment_reference=adjustment_reference,
                        gross_amount=0,
                        paystack_fee=0,
                        net_amount=0,
                        rate_percent=0,
                        amount=-abs(commission.amount),
                        status=Commission.STATUS_REVERSED,
                        reversed_reason='Membership payment refunded after payout',
                        approve_after=timezone.now(),
                    )
    except IntegrityError:
        if not Commission.objects.filter(payment_reference=f'{payment.reference}-refund').exists():
            raise
