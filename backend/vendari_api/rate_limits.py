from django.core.cache import cache
from rest_framework.response import Response
from rest_framework import status


def rate_limited(request, scope, limit, window, identifier=''):
    forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR', '').split(',')[0].strip()
    client_ip = forwarded_for or request.META.get('REMOTE_ADDR', 'unknown')
    key = f'rate-limit:{scope}:{client_ip}:{identifier}'
    try:
        current = cache.incr(key)
    except ValueError:
        cache.add(key, 1, timeout=window)
        current = 1
    return current > limit


def too_many_requests(detail='Too many requests. Please try again later.'):
    return Response({'detail': detail}, status=status.HTTP_429_TOO_MANY_REQUESTS)
