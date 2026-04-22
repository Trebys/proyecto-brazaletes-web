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

    PAYMENT_METHOD_INTERNAL = 'INTERNAL'
    PAYMENT_METHOD_PAYPAL = 'PAYPAL'
    PAYMENT_METHODS = (
        (PAYMENT_METHOD_INTERNAL, 'Saldo Interno'),
        (PAYMENT_METHOD_PAYPAL, 'PayPal'),
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

    STATUS_PENDING = 'PENDING'
    STATUS_APPROVED = 'APPROVED'
    STATUS_CAPTURED = 'CAPTURED'
    STATUS_REFUNDED = 'REFUNDED'
    STATUS_CHOICES = (
        (STATUS_PENDING, 'Pendiente'),
        (STATUS_APPROVED, 'Aprobado'),
        (STATUS_CAPTURED, 'Capturado'),
        (STATUS_REFUNDED, 'Reembolsado'),
    )
    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default=STATUS_PENDING
    )

    def __str__(self):
        return (
            f"Purchase #{self.id} - {self.bracelet} - User: {self.user} "
            f"- {self.payment_method} - Status: {self.status}"
        )


class BraceletTransaction(models.Model):
    TYPE_ATTRACTION_CONSUMPTION = 'ATTRACTION_CONSUMPTION'
    TYPE_FOOD_CONSUMPTION = 'FOOD_CONSUMPTION'
    TRANSACTION_TYPES = (
        (TYPE_ATTRACTION_CONSUMPTION, 'Consumo de atraccion'),
        (TYPE_FOOD_CONSUMPTION, 'Consumo de comida'),
    )

    bracelet = models.ForeignKey(
        Bracelet,
        on_delete=models.CASCADE,
        related_name='transactions'
    )
    owner = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        blank=True,
        null=True,
        related_name='bracelet_transactions'
    )
    performed_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        blank=True,
        null=True,
        related_name='performed_bracelet_transactions'
    )
    attraction = models.ForeignKey(
        'atracciones_comidas.Attractions',
        on_delete=models.SET_NULL,
        blank=True,
        null=True,
        related_name='bracelet_transactions'
    )
    food = models.ForeignKey(
        'atracciones_comidas.Food',
        on_delete=models.SET_NULL,
        blank=True,
        null=True,
        related_name='bracelet_transactions'
    )
    transaction_type = models.CharField(
        max_length=40,
        choices=TRANSACTION_TYPES
    )
    concept = models.CharField(max_length=150)
    balance_delta = models.DecimalField(
        max_digits=9,
        decimal_places=2,
        default=0
    )
    uses_delta = models.IntegerField(default=0)
    balance_before = models.DecimalField(
        max_digits=9,
        decimal_places=2,
        default=0
    )
    balance_after = models.DecimalField(
        max_digits=9,
        decimal_places=2,
        default=0
    )
    uses_before = models.PositiveIntegerField(default=0)
    uses_after = models.PositiveIntegerField(default=0)
    occurred_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-occurred_at', '-id']

    def __str__(self):
        return f"{self.transaction_type} - {self.bracelet} - {self.occurred_at}"
