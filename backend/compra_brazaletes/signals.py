# signals.py
from django.db.models.signals import post_save
from django.dispatch import receiver
from .models import Bracelet, PurchaseReceipt


@receiver(post_save, sender=Bracelet)
def assign_bracelet_code(sender, instance, created, **kwargs):
    """
    Assign 'bracelet_code' to a Bracelet once it's created for the first time.
    """
    if created and not instance.bracelet_code:
        instance.bracelet_code = f"BR-{instance.id}"
        instance.save(update_fields=['bracelet_code'])


@receiver(post_save, sender=PurchaseReceipt)
def assign_purchase_code(sender, instance, created, **kwargs):
    """
    Assign 'purchase_code' to the PurchaseReceipt once it's created for the first time.
    """
    if created and not instance.purchase_code:
        instance.purchase_code = f"ORDER-{instance.id}"
        instance.save(update_fields=['purchase_code'])
