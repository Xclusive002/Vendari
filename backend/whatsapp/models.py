from django.db import models


class WhatsAppPendingAction(models.Model):
    ACTION_SALE = 'sale'
    ACTION_INVENTORY = 'inventory'
    ACTION_CUSTOMER = 'customer'
    ACTION_CHOICES = [
        (ACTION_SALE, 'Sale'),
        (ACTION_INVENTORY, 'Inventory'),
        (ACTION_CUSTOMER, 'Customer'),
    ]

    business = models.ForeignKey('businesses.Business', on_delete=models.CASCADE, related_name='whatsapp_pending_actions')
    phone_number = models.CharField(max_length=30)
    action_type = models.CharField(max_length=20, choices=ACTION_CHOICES)
    payload = models.JSONField(default=dict)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(fields=('business', 'phone_number'), name='unique_whatsapp_pending_business_phone'),
        ]
        ordering = ('-created_at',)

    def __str__(self):
        return f'{self.business.name} - {self.phone_number} - {self.action_type}'
