from django.contrib.auth.models import AbstractUser
from django.db import models
from rest_framework.authtoken.models import Token

from .authentication import is_token_expired


def user_profile_image_path(instance, filename):
    return f'users/user_{instance.id}/profile/{filename}'


class User(AbstractUser):
    account_balance = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        null=True,
        blank=True,
    )
    profile_image = models.ImageField(
        upload_to=user_profile_image_path,
        blank=True,
        null=True,
    )

    @property
    def is_admin_user(self):
        return bool(self.is_active and self.is_staff)

    def save(self, *args, **kwargs):
        # In Django, a superuser should always be able to enter the admin site.
        if self.is_superuser and not self.is_staff:
            self.is_staff = True
        super().save(*args, **kwargs)


class ExpiringToken(Token):
    """Proxy de Token con la politica de expiracion del proyecto."""

    class Meta:
        proxy = True

    @property
    def is_expired(self):
        return is_token_expired(self)

    def refresh_token(self):
        self.delete()
        new_token = ExpiringToken.objects.create(user=self.user)
        return new_token
