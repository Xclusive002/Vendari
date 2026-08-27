from django.contrib import admin

from .models import Business, ConciergeInquiry, InviteCode, Membership


@admin.register(Business)
class BusinessAdmin(admin.ModelAdmin):
    list_display = ('name', 'owner', 'email', 'business_type', 'created_at')
    list_filter = ('business_type', 'created_at')
    search_fields = ('name', 'email', 'owner__email', 'paystack_subaccount_code')
    readonly_fields = ('paystack_subaccount_code',)


@admin.register(Membership)
class MembershipAdmin(admin.ModelAdmin):
    list_display = ('user', 'business', 'role', 'created_at')
    list_filter = ('business', 'role')
    search_fields = ('user__email', 'business__name')


@admin.register(InviteCode)
class InviteCodeAdmin(admin.ModelAdmin):
    list_display = ('code', 'business', 'role', 'used', 'created_at')
    list_filter = ('business', 'role', 'used')
    search_fields = ('code', 'business__name')


@admin.register(ConciergeInquiry)
class ConciergeInquiryAdmin(admin.ModelAdmin):
    list_display = ('business_name', 'name', 'phone', 'created_at')
    list_filter = ('created_at',)
    search_fields = ('name', 'business_name', 'phone', 'interest')
