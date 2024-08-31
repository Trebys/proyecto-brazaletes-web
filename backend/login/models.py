from django.db import models
from django.contrib.auth.models import AbstractUser #Revisar video


class User(AbstractUser):
    account_balance = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)