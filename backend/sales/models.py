from django.db import models
from django.utils import timezone


class Sale(models.Model):
    business = models.ForeignKey('businesses.Business', related_name='sales', on_delete=models.CASCADE)
    item = models.ForeignKey('inventory.InventoryItem', null=True, blank=True, on_delete=models.SET_NULL, related_name='sales')
    product_name = models.CharField(max_length=255)
    quantity = models.IntegerField()
    unit_price = models.DecimalField(max_digits=12, decimal_places=2)
    total = models.DecimalField(max_digits=12, decimal_places=2)
    payment_method = models.CharField(max_length=50)
    sold_at = models.DateTimeField(default=timezone.now)

    def __str__(self):
        return f'{self.product_name} - {self.total}'
