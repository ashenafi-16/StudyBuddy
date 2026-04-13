from rest_framework.throttling import SimpleRateThrottle


class LoginRateThrottle(SimpleRateThrottle):
    """Strict rate limit for authentication endpoints (login, register)."""
    scope = 'login'

    def get_cache_key(self, request, view):
        # Throttle by IP for unauthenticated endpoints
        return self.cache_format % {
            'scope': self.scope,
            'ident': self.get_ident(request),
        }


class HeartbeatRateThrottle(SimpleRateThrottle):
    """Rate limit for study activity heartbeat pings."""
    scope = 'heartbeat'

    def get_cache_key(self, request, view):
        if request.user and request.user.is_authenticated:
            return self.cache_format % {
                'scope': self.scope,
                'ident': request.user.pk,
            }
        return self.cache_format % {
            'scope': self.scope,
            'ident': self.get_ident(request),
        }
