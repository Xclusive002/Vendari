from rest_framework import serializers

from .models import Customer


class CustomerSerializer(serializers.ModelSerializer):
    total_spent = serializers.DecimalField(max_digits=12, decimal_places=2, read_only=True)
    order_count = serializers.IntegerField(read_only=True)
    last_purchase_date = serializers.DateField(read_only=True, allow_null=True)
    days_since_last_purchase = serializers.IntegerField(read_only=True, allow_null=True)
    owing_amount = serializers.DecimalField(max_digits=12, decimal_places=2, read_only=True)
    segment = serializers.CharField(read_only=True)

    class Meta:
        model = Customer
        fields = (
            'id', 'business', 'name', 'phone', 'email', 'address', 'notes',
            'created_at', 'updated_at', 'total_spent', 'order_count',
            'last_purchase_date', 'days_since_last_purchase', 'segment', 'owing_amount',
        )
        read_only_fields = ('business', 'created_at', 'updated_at')
