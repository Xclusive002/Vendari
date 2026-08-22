from django.db import models


class InventoryItem(models.Model):
    business = models.ForeignKey('businesses.Business', related_name='inventory_items', on_delete=models.CASCADE)
    product_name = models.CharField(max_length=255)
    code = models.CharField(max_length=100, blank=True)
    category = models.CharField(max_length=100, blank=True)
    qty_in_stock = models.IntegerField()
    reorder_level = models.IntegerField(default=5)
    cost_price = models.DecimalField(max_digits=12, decimal_places=2)
    selling_price = models.DecimalField(max_digits=12, decimal_places=2)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.product_name
