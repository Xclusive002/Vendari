import re

from django.conf import settings
from django.core.exceptions import ValidationError
from django.db import models
from django.utils import timezone
from decimal import Decimal


class StorefrontSettings(models.Model):
    DELIVERY_PICKUP = 'pickup'
    DELIVERY_DELIVERY = 'delivery'
    DELIVERY_BOTH = 'both'
    DELIVERY_CHOICES = [
        (DELIVERY_PICKUP, 'Pickup'),
        (DELIVERY_DELIVERY, 'Delivery'),
        (DELIVERY_BOTH, 'Both'),
    ]

    RESERVED_SLUGS = [
        'admin', 'api', 'dashboard', 'concierge', 'app', 'mail', 'blog', 'pricing', 'settings',
        'login', 'register', 's', 'store', 'help', 'support', 'checkout', 'products', 'customers',
        'inventory', 'sales', 'invoices', 'reports', 'team', 'expenses', 'setup', 'ask', 'notifications',
        'payment', 'privacy', 'terms', 'dmca', 'verify-email', 'concierge-inquiry', 'auth', 'logout',
        'account', 'search', 'messages', 'whatsapp', 'subscriptions', 'billing', 'about', 'contact',
    ]

    business = models.OneToOneField('Business', on_delete=models.CASCADE, related_name='storefront_settings')
    slug = models.CharField(max_length=80, unique=True, db_index=True)
    is_published = models.BooleanField(default=False)
    theme = models.CharField(max_length=40, default='classic')
    primary_color = models.CharField(max_length=32, default='#4683EC')
    accent_color = models.CharField(max_length=32, blank=True, default='')
    banner_image = models.ImageField(upload_to='storefront_banners/', blank=True, null=True)
    description = models.TextField(blank=True)
    whatsapp_number = models.CharField(max_length=30, blank=True, default='')
    social_links = models.JSONField(default=dict, blank=True)
    delivery_option = models.CharField(max_length=20, choices=DELIVERY_CHOICES, default=DELIVERY_BOTH)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ('slug',)

    def __str__(self):
        return f'{self.business.name} storefront'

    def clean(self):
        super().clean()
        if self.slug:
            self.slug = self.validate_slug_candidate(self.slug, business=self.business)

    def save(self, *args, **kwargs):
        self.full_clean()
        super().save(*args, **kwargs)

    @staticmethod
    def normalize_slug(raw_slug):
        value = (raw_slug or '').strip().lower()
        value = value.replace(' ', '')
        value = re.sub(r'[^a-z0-9]+', '', value)
        return value

    @classmethod
    def validate_slug_candidate(cls, slug, business=None):
        value = cls.normalize_slug(slug)
        if not value:
            raise ValidationError('Please choose a storefront slug.')
        if value in cls.RESERVED_SLUGS:
            raise ValidationError(f'"{slug}" is a reserved storefront slug and cannot be used.')
        existing = cls.objects.filter(slug=value)
        if business is not None:
            existing = existing.exclude(business=business)
        if existing.exists():
            raise ValidationError(f'"{value}" is already taken. Please choose a different storefront slug.')
        return value

    @classmethod
    def generate_unique_slug_for_business(cls, business):
        base = cls.normalize_slug(getattr(business, 'name', '') or 'shop')
        if not base:
            base = 'shop'
        if base in cls.RESERVED_SLUGS:
            base = f'{base}store'
        candidate = base
        counter = 2
        while True:
            if candidate in cls.RESERVED_SLUGS:
                candidate = f'{base}{counter}'
                counter += 1
                continue
            if not cls.objects.filter(slug=candidate).exclude(business=business).exists():
                return candidate
            candidate = f'{base}{counter}'
            counter += 1

    @classmethod
    def generate_for_business(cls, business):
        slug = cls.generate_unique_slug_for_business(business)
        return cls.objects.create(business=business, slug=slug)

    @classmethod
    def ensure_for_business(cls, business):
        settings, created = cls.objects.get_or_create(
            business=business,
            defaults={'slug': cls.generate_unique_slug_for_business(business)},
        )
        if created:
            return settings
        if not settings.slug:
            settings.slug = cls.generate_unique_slug_for_business(business)
            settings.save(update_fields=['slug'])
        return settings


class StorefrontOrder(models.Model):
    STATUS_PENDING_WHATSAPP = 'pending_whatsapp'
    STATUS_PENDING_PAYMENT = 'pending_payment'
    STATUS_PAID = 'paid'
    STATUS_CANCELLED = 'cancelled'
    STATUS_CHOICES = [
        (STATUS_PENDING_WHATSAPP, 'Pending WhatsApp'),
        (STATUS_PENDING_PAYMENT, 'Pending payment'),
        (STATUS_PAID, 'Paid'),
        (STATUS_CANCELLED, 'Cancelled'),
    ]

    business = models.ForeignKey('Business', related_name='storefront_orders', on_delete=models.CASCADE)
    customer_name = models.CharField(max_length=255)
    customer_phone = models.CharField(max_length=30)
    customer_address = models.TextField(blank=True)
    delivery_option = models.CharField(max_length=20, choices=StorefrontSettings.DELIVERY_CHOICES)
    status = models.CharField(max_length=30, choices=STATUS_CHOICES, default=STATUS_PENDING_WHATSAPP)
    created_at = models.DateTimeField(auto_now_add=True)
    total = models.DecimalField(max_digits=12, decimal_places=2, default=Decimal('0.00'))
    paystack_reference = models.CharField(max_length=255, unique=True, null=True, blank=True)


class StorefrontOrderLineItem(models.Model):
    order = models.ForeignKey(StorefrontOrder, related_name='line_items', on_delete=models.CASCADE)
    inventory_item = models.ForeignKey('inventory.InventoryItem', on_delete=models.PROTECT)
    quantity = models.PositiveIntegerField()
    unit_price = models.DecimalField(max_digits=12, decimal_places=2)
    line_total = models.DecimalField(max_digits=12, decimal_places=2, default=Decimal('0.00'))

    def save(self, *args, **kwargs):
        self.line_total = Decimal(self.quantity) * Decimal(str(self.unit_price))
        super().save(*args, **kwargs)


class Business(models.Model):
    owner = models.ForeignKey(settings.AUTH_USER_MODEL, related_name='businesses', on_delete=models.CASCADE)
    name = models.CharField(max_length=255)
    email = models.EmailField(max_length=255, blank=True)
    phone = models.CharField(max_length=20, blank=True)
    whatsapp_number = models.CharField(max_length=30, unique=True, blank=True, null=True)
    address = models.TextField(blank=True)
    logo = models.ImageField(upload_to='business_logos/', blank=True, null=True)
    business_type = models.CharField(max_length=100, blank=True)
    bank_code = models.CharField(max_length=20, blank=True)
    bank_account_number = models.CharField(max_length=20, blank=True)
    bank_account_name = models.CharField(max_length=255, blank=True)
    paystack_subaccount_code = models.CharField(max_length=100, blank=True)
    platform_fee_percentage = models.DecimalField(max_digits=5, decimal_places=2, default=Decimal('0.00'))
    plan = models.ForeignKey('billing.Plan', null=True, blank=True, on_delete=models.SET_NULL, related_name='businesses')
    trial_started_at = models.DateTimeField(null=True, blank=True)
    trial_ends_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.name

    @property
    def has_complete_profile(self):
        return bool(self.name.strip() and self.address.strip() and self.phone.strip())

    @property
    def trial_active(self):
        return bool(self.trial_ends_at and self.trial_ends_at > timezone.now())

    @property
    def access_active(self):
        subscription = getattr(self, 'subscription', None)
        if subscription and subscription.status == 'active':
            return not subscription.renews_at or subscription.renews_at > timezone.now()
        return self.trial_active

    @property
    def has_active_access(self):
        return self.access_active

    @property
    def has_payments_enabled(self):
        return bool(self.paystack_subaccount_code and self.paystack_subaccount_code.strip())


class Membership(models.Model):
    ROLE_OWNER = 'owner'
    ROLE_STAFF = 'staff'
    ROLE_ACCOUNTANT = 'accountant'
    ROLE_CHOICES = [
        (ROLE_OWNER, 'Owner'),
        (ROLE_STAFF, 'Staff'),
        (ROLE_ACCOUNTANT, 'Accountant'),
    ]

    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    business = models.ForeignKey(Business, on_delete=models.CASCADE)
    role = models.CharField(max_length=20, choices=ROLE_CHOICES)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('user', 'business')

    def __str__(self):
        return f'{self.user.email} - {self.business.name} ({self.role})'


class InviteCode(models.Model):
    business = models.ForeignKey(Business, on_delete=models.CASCADE, related_name='invite_codes')
    code = models.CharField(max_length=32, unique=True)
    email = models.EmailField(blank=True)
    role = models.CharField(max_length=20, choices=Membership.ROLE_CHOICES, default=Membership.ROLE_STAFF)
    used = models.BooleanField(default=False)
    expires_at = models.DateTimeField(null=True, blank=True)
    revoked_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f'{self.code} - {self.business.name}'


class ConciergeInquiry(models.Model):
    name = models.CharField(max_length=255)
    business_name = models.CharField(max_length=255)
    phone = models.CharField(max_length=50)
    interest = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ('-created_at',)

    def __str__(self):
        return f'{self.business_name} - {self.name}'
