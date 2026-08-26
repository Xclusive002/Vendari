from django.conf import settings
from django.db import models


class Business(models.Model):
    owner = models.ForeignKey(settings.AUTH_USER_MODEL, related_name='businesses', on_delete=models.CASCADE)
    name = models.CharField(max_length=255)
    email = models.EmailField(max_length=255, blank=True)
    phone = models.CharField(max_length=20, blank=True)
    address = models.TextField(blank=True)
    logo = models.ImageField(upload_to='business_logos/', blank=True, null=True)
    business_type = models.CharField(max_length=100, blank=True)
    plan = models.ForeignKey('billing.Plan', null=True, blank=True, on_delete=models.SET_NULL, related_name='businesses')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.name

    @property
    def has_complete_profile(self):
        return bool(self.name.strip() and self.address.strip() and self.phone.strip())


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
    role = models.CharField(max_length=20, choices=Membership.ROLE_CHOICES, default=Membership.ROLE_STAFF)
    used = models.BooleanField(default=False)
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
