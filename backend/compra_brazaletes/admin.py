from django.contrib import admin
from .models import Bracelet, BraceletTransaction, BraceletType, PurchaseReceipt, Sale, SaleLine
# Register your models here.
admin.site.register(Bracelet)
admin.site.register(BraceletType)
admin.site.register(PurchaseReceipt)
admin.site.register(Sale)
admin.site.register(SaleLine)
admin.site.register(BraceletTransaction)
