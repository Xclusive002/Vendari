from rest_framework.permissions import BasePermission

from businesses.models import Business, Membership


class IsBusinessMember(BasePermission):
    message = 'You must be a member of this business to access this resource.'

    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        business_id = view.kwargs.get('business_id', view.kwargs.get('business_pk'))
        if business_id is not None:
            return (
                Membership.objects.filter(user=request.user, business_id=business_id).exists()
                or Business.objects.filter(pk=business_id, owner=request.user).exists()
            )
        return True

    def has_object_permission(self, request, view, obj):
        business = obj if isinstance(obj, Business) else getattr(obj, 'business', None)
        if business is None:
            return False
        return (
            Membership.objects.filter(user=request.user, business=business).exists()
            or business.owner_id == request.user.id
        )