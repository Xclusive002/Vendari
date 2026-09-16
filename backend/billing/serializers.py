from rest_framework import serializers

from .models import Plan


class PaystackInitializeSerializer(serializers.Serializer):
    business_id = serializers.IntegerField()
    plan_id = serializers.IntegerField(required=False)
    billing_interval = serializers.ChoiceField(choices=Plan.INTERVAL_CHOICES, default=Plan.INTERVAL_MONTHLY)

    def validate(self, attrs):
        from businesses.models import Business, Membership

        user = self.context['request'].user
        business = Business.objects.filter(
            pk=attrs['business_id'], owner=user,
        ).first()
        if business is None:
            raise serializers.ValidationError({'business_id': 'You are not a member of this business.'})
        interval = attrs['billing_interval']
        plan_id = attrs.get('plan_id')
        plan = Plan.objects.filter(
            pk=plan_id,
            name=Plan.PLAN_PRO,
            interval=interval,
        ).first() if plan_id else Plan.objects.filter(
            name=Plan.PLAN_PRO,
            interval=interval,
        ).first()
        if plan is None:
            raise serializers.ValidationError({'billing_interval': 'That Vendari membership interval is unavailable.'})
        attrs.update(business=business, plan=plan)
        return attrs