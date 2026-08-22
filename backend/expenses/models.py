from django.db import models


class Expense(models.Model):
    business = models.ForeignKey('businesses.Business', related_name='expenses', on_delete=models.CASCADE)
    date = models.DateField()
    category = models.CharField(max_length=100)
    description = models.TextField(blank=True)
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    payment_method = models.CharField(max_length=50)

    def __str__(self):
        return f'{self.category} - {self.amount}'
