from rest_framework.exceptions import APIException
from rest_framework.permissions import BasePermission

from businesses.models import Business, Membership


class TrialExpired(APIException):
    status_code = 402
    default_detail = 'Your 5-day trial has ended. Subscribe for ₦4,999/month to continue using Vendari.'
    default_code = 'trial_expired'


class IsBusinessMember(BasePermission):
    message = 'You must be a member of this business to access this resource.'

    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        business_id = view.kwargs.get('business_id', view.kwargs.get('business_pk'))
        if business_id is not None:
            has_membership = (
                Membership.objects.filter(user=request.user, business_id=business_id).exists()
                or Business.objects.filter(pk=business_id, owner=request.user).exists()
            )
            if not has_membership:
                return False
            business = Business.objects.filter(pk=business_id).first()
            if business and not getattr(view, 'allow_expired_trial', False) and not business.access_active:
                raise TrialExpired()
            return True
        return True

    def has_object_permission(self, request, view, obj):
        business = obj if isinstance(obj, Business) else getattr(obj, 'business', None)
        if business is None:
            return False
        return (
            Membership.objects.filter(user=request.user, business=business).exists()
            or business.owner_id == request.user.id
        )