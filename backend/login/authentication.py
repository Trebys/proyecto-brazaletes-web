from datetime import timedelta

from django.conf import settings
from django.utils import timezone
from rest_framework.authentication import TokenAuthentication
from rest_framework.exceptions import AuthenticationFailed


SESSION_EXPIRED_MESSAGE = (
    'Tu sesion expiro por inactividad. Inicia sesion nuevamente.'
)
SESSION_INACTIVE_MESSAGE = 'Tu sesion ya no esta activa. Inicia sesion nuevamente.'
USER_INACTIVE_MESSAGE = 'Usuario inactivo o eliminado.'


def get_session_idle_timeout():
    return timedelta(minutes=settings.SESSION_IDLE_TIMEOUT_MINUTES)


def get_session_idle_timeout_seconds():
    return int(get_session_idle_timeout().total_seconds())


def is_token_expired(token):
    return timezone.now() >= token.created + get_session_idle_timeout()


def touch_token(token):
    token.created = timezone.now()
    token.save(update_fields=['created'])


class ExpiringTokenAuthentication(TokenAuthentication):
    def authenticate_credentials(self, key):
        model = self.get_model()

        try:
            token = model.objects.select_related('user').get(key=key)
        except model.DoesNotExist:
            raise AuthenticationFailed(SESSION_INACTIVE_MESSAGE)

        if not token.user.is_active:
            raise AuthenticationFailed(USER_INACTIVE_MESSAGE)

        if is_token_expired(token):
            token.delete()
            raise AuthenticationFailed(SESSION_EXPIRED_MESSAGE)

        touch_token(token)
        return token.user, token
