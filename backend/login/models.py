#Importaciones necesarias para el modelo User
from django.db import models
from django.contrib.auth.models import AbstractUser

#Imports para el modelo ExpiringToken
from django.conf import settings
from django.utils import timezone
from datetime import timedelta
from rest_framework.authtoken.models import Token


class User(AbstractUser):
    account_balance = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)



class ExpiringToken(Token):
    """ Extiende el modelo de token para añadir un tiempo de expiración """
    class Meta:
        proxy = True

    @property
    def is_expired(self):
        """ Verifica si el token ha expirado """
        expiration_time = self.created + timedelta(minutes=1)  # 15 minutos de vida útil
        return timezone.now() > expiration_time

    def refresh_token(self):
        """ Renueva el token al generar uno nuevo """
        self.delete()
        new_token = ExpiringToken.objects.create(user=self.user)
        return new_token