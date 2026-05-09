from django.contrib.auth.models import AbstractUser
from django.conf import settings
from django.db import models
from django.utils import timezone
from rest_framework.authtoken.models import Token

from .authentication import is_token_expired


def user_profile_image_path(instance, filename):
    return f'users/user_{instance.id}/profile/{filename}'


class User(AbstractUser):
    username = models.CharField(
        max_length=150,
        unique=True,
        help_text='Requerido. Puede incluir letras, numeros, espacios y simbolos comunes.',
        error_messages={
            'unique': 'Ya existe un usuario con este nombre.',
        },
    )
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


class PasswordResetCode(models.Model):
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='password_reset_codes',
    )
    code_hash = models.CharField(max_length=128)
    email = models.EmailField()
    expires_at = models.DateTimeField()
    used_at = models.DateTimeField(blank=True, null=True)
    attempts = models.PositiveSmallIntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        indexes = [
            models.Index(fields=['email', 'created_at']),
            models.Index(fields=['user', 'used_at', 'expires_at']),
        ]
        ordering = ['-created_at']

    @property
    def is_expired(self):
        return timezone.now() >= self.expires_at

    @property
    def is_used(self):
        return self.used_at is not None

    def mark_used(self):
        self.used_at = timezone.now()
        self.save(update_fields=['used_at'])
