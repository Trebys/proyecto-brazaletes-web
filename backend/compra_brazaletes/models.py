from django.db import models
from django.conf import settings
import random
import string


class BraceletType(models.Model):
    """
    Catalog of different bracelet types:
      - E.g. Standard, Special, Premium, etc.
      - Their prices, attraction uses, initial food balance, image, description...
    """
    name = models.CharField(max_length=100, unique=True)
    price = models.DecimalField(max_digits=8, decimal_places=2)
    attraction_uses = models.PositiveIntegerField(default=0)
    food_balance = models.DecimalField(
        max_digits=8, decimal_places=2, default=0)
    description = models.TextField(blank=True, null=True)

    # If you want to store the route/URL of the image
    # image_url = models.URLField(blank=True, null=True)

    # Or use an ImageField
    image = models.ImageField(
        upload_to='bracelets/',
        blank=True,
        null=True
    )

    def __str__(self):
        return self.name


class Bracelet(models.Model):
    id = models.AutoField(primary_key=True)
    bracelet_type = models.ForeignKey(
        BraceletType,
        on_delete=models.CASCADE,
        related_name='bracelets'
    )
    bracelet_code = models.CharField(
        max_length=10,
        unique=True,
        blank=True,
        null=True
    )
    current_balance = models.DecimalField(
        max_digits=8,
        decimal_places=2,
        default=0
    )

    # Nuevo campo para usos de atracciones restantes
    attraction_uses_remaining = models.PositiveIntegerField(default=0)

    def __str__(self):
        return f"{self.bracelet_type.name} ({self.bracelet_code})"


class PurchaseReceipt(models.Model):
    """
    Stores the purchase made by a user.
    """
    id = models.AutoField(primary_key=True)
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='purchase_receipts'
    )
    bracelet = models.ForeignKey(
        Bracelet,
        on_delete=models.CASCADE,
        related_name='purchase_receipts'
    )
    purchase_date = models.DateTimeField(auto_now_add=True)

    purchase_code = models.CharField(max_length=50, blank=True, null=True)

    PAYMENT_METHODS = (
        ('INTERNAL', 'Saldo Interno'),
        ('PAYPAL', 'PayPal'),
    )
    payment_method = models.CharField(
        max_length=20,
        choices=PAYMENT_METHODS,
        default='INTERNAL'
    )
    paypal_order_id = models.CharField(max_length=100, blank=True, null=True)
    amount_paid = models.DecimalField(
        max_digits=8, decimal_places=2, blank=True, null=True
    )

    # === NUEVO: Estado de la compra ===
    STATUS_CHOICES = (
        ('CREATED', 'Creado'),
        ('CAPTURED', 'Capturado'),
        ('REFUNDED', 'Reembolsado'),
        # Agrega más si requieres
    )
    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default='CREATED'
    )

    def __str__(self):
        return (
            f"Purchase #{self.id} - {self.bracelet} - User: {self.user} "
            f"- {self.payment_method} - Status: {self.status}"
        )
