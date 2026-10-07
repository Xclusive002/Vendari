from django.core.cache import cache
from rest_framework.response import Response
from rest_framework import status


def rate_limited(request, scope, limit, window, identifier=''):
    client_ip = request.META.get('REMOTE_ADDR', 'unknown')
    key = f'rate-limit:{scope}:{client_ip}:{identifier}'
    if cache.add(key, 1, timeout=window):
        current = 1
    else:
        try:
            current = cache.incr(key)
        except ValueError:
            if cache.add(key, 1, timeout=window):
                current = 1
            else:
                current = cache.incr(key)
    return current > limit


def too_many_requests(detail='Too many requests. Please try again later.'):
    return Response({'detail': detail}, status=status.HTTP_429_TOO_MANY_REQUESTS)
