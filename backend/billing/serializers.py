from rest_framework import serializers

from .models import Plan


class PaystackInitializeSerializer(serializers.Serializer):
    business_id = serializers.IntegerField()
    plan_id = serializers.IntegerField()

    def validate(self, attrs):
        from businesses.models import Business, Membership

        user = self.context['request'].user
        business = Business.objects.filter(
            pk=attrs['business_id'], owner=user,
        ).first()
        if business is None:
            raise serializers.ValidationError({'business_id': 'You are not a member of this business.'})
        try:
            plan = Plan.objects.get(pk=attrs['plan_id'])
        except Plan.DoesNotExist:
            raise serializers.ValidationError({'plan_id': 'Plan not found.'})
        if plan.name != Plan.PLAN_PRO or plan.amount != 9999:
            raise serializers.ValidationError({'plan_id': 'The Vendari Pro plan is ₦9,999 per month.'})
        attrs.update(business=business, plan=plan)
        return attrs