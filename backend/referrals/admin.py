from django.contrib import admin
from django.contrib import messages
from django.db.models import Count, ExpressionWrapper, F, FloatField, Q, Sum
from django.utils import timezone
from django.contrib.auth import get_user_model

from .fraud import refresh_referral_fraud_flags
from .models import Commission, Payout, PayoutAccount, PayoutAuditLog, Referral, ReferralCode, ReferralFraudFlag


@admin.register(ReferralCode)
class ReferralCodeAdmin(admin.ModelAdmin):
    list_display = ('user', 'code', 'created_at')
    search_fields = ('user__email', 'code')
    list_filter = ('created_at',)


@admin.register(Referral)
class ReferralAdmin(admin.ModelAdmin):
    list_display = ('referrer', 'referred_user', 'code_used', 'status', 'created_at', 'converted_at', 'first_paid_at', 'bonus_granted_at')
    search_fields = ('referrer__email', 'referred_user__email', 'code_used__code', 'rejection_reason')
    list_filter = ('status', 'created_at', 'converted_at', 'first_paid_at', 'bonus_granted_at')
    readonly_fields = ('created_at',)
    change_list_template = 'admin/referrals/referral/change_list.html'
    actions = ('scan_selected_referrers_for_fraud',)

    @admin.action(description='Scan selected referrers for fraud indicators')
    def scan_selected_referrers_for_fraud(self, request, queryset):
        referrer_ids = queryset.values_list('referrer_id', flat=True).distinct()
        scanned = 0
        for referrer_id in referrer_ids:
            refresh_referral_fraud_flags(get_user_model().objects.get(pk=referrer_id))
            scanned += 1
        self.message_user(request, f'Scanned {scanned} referrer account(s).', messages.SUCCESS)

    def changelist_view(self, request, extra_context=None):
        current_month = timezone.localdate().replace(day=1)
        metrics = {
            'commission_liability': Commission.objects.filter(
                status__in=(Commission.STATUS_PENDING, Commission.STATUS_APPROVED)
            ).aggregate(total=Sum('amount'))['total'] or 0,
            'payouts_this_month': Payout.objects.filter(
                status=Payout.STATUS_SUCCESS,
                completed_at__date__gte=current_month,
            ).aggregate(total=Sum('amount'))['total'] or 0,
            'top_referrers': list(
                Referral.objects.filter(
                    status__in=(Referral.STATUS_SIGNED_UP, Referral.STATUS_CONVERTED)
                ).values('referrer__email').annotate(
                    paid=Count('pk', filter=Q(status=Referral.STATUS_CONVERTED)),
                    signups=Count('pk'),
                ).order_by('-paid', '-signups')[:10]
            ),
            'conversion_by_referrer': list(
                Referral.objects.filter(
                    status__in=(Referral.STATUS_SIGNED_UP, Referral.STATUS_CONVERTED)
                ).values('referrer__email').annotate(
                    paid=Count('pk', filter=Q(status=Referral.STATUS_CONVERTED)),
                    signups=Count('pk'),
                ).annotate(
                    conversion_rate=ExpressionWrapper(
                        100.0 * F('paid') / F('signups'),
                        output_field=FloatField(),
                    )
                ).order_by('-conversion_rate')[:10]
            ),
            'flagged_accounts': list(
                ReferralFraudFlag.objects.filter(resolved_at__isnull=True)
                .select_related('referrer')
                .order_by('-created_at')[:20]
            ),
        }
        return super().changelist_view(
            request,
            extra_context={**(extra_context or {}), **metrics},
        )


@admin.register(Commission)
class CommissionAdmin(admin.ModelAdmin):
    list_display = ('referral', 'referrer', 'source', 'gross_amount', 'paystack_fee', 'net_amount', 'rate_percent', 'amount', 'status', 'created_at')
    search_fields = ('referrer__email', 'payment_reference', 'referral__referred_user__email')
    list_filter = ('status', 'source', 'created_at', 'approve_after')
    readonly_fields = ('created_at',)


@admin.register(PayoutAccount)
class PayoutAccountAdmin(admin.ModelAdmin):
    list_display = ('user', 'bank_name', 'account_number', 'account_name', 'verified_at', 'withdrawal_locked_until')
    search_fields = ('user__email', 'bank_name', 'account_number', 'account_name', 'paystack_recipient_code')
    list_filter = ('verified_at',)


@admin.register(Payout)
class PayoutAdmin(admin.ModelAdmin):
    list_display = ('user', 'amount', 'fee', 'status', 'reference', 'paystack_transfer_code', 'created_at', 'completed_at')
    search_fields = ('user__email', 'reference', 'paystack_transfer_code', 'failure_reason')
    list_filter = ('status', 'created_at', 'completed_at')
    readonly_fields = ('created_at',)

    @admin.action(description='Mark selected payouts as resolved')
    def mark_resolved(self, request, queryset):
        for payout in queryset:
            payout.status = Payout.STATUS_FAILED if payout.status == Payout.STATUS_PROCESSING else payout.status
            payout.completed_at = payout.completed_at or payout.created_at
            payout.save(update_fields=['status', 'completed_at'])

    @admin.action(description='Retry selected stuck payouts')
    def retry_stuck(self, request, queryset):
        for payout in queryset.filter(status=Payout.STATUS_FAILED):
            payout.status = Payout.STATUS_PROCESSING
            payout.completed_at = None
            payout.save(update_fields=['status', 'completed_at'])


@admin.register(PayoutAuditLog)
class PayoutAuditLogAdmin(admin.ModelAdmin):
    list_display = ('user', 'action', 'amount', 'reference', 'created_at')
    search_fields = ('user__email', 'action', 'reference', 'details')
    list_filter = ('action', 'created_at')
    readonly_fields = ('created_at',)


@admin.register(ReferralFraudFlag)
class ReferralFraudFlagAdmin(admin.ModelAdmin):
    list_display = ('referrer', 'code', 'details', 'created_at', 'resolved_at', 'resolved_by')
    list_filter = ('code', 'created_at', 'resolved_at')
    search_fields = ('referrer__email', 'details')
    readonly_fields = ('created_at',)
    actions = ('mark_reviewed',)

    @admin.action(description='Mark selected fraud flags reviewed')
    def mark_reviewed(self, request, queryset):
        queryset.filter(resolved_at__isnull=True).update(
            resolved_at=timezone.now(),
            resolved_by=request.user,
        )
        self.message_user(request, 'Selected fraud flags were marked reviewed.', messages.SUCCESS)
