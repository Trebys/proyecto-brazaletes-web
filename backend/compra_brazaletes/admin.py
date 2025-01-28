from django.contrib import admin
from .models import Bracelet, BraceletType, PurchaseReceipt
# Register your models here.
admin.site.register(Bracelet)
admin.site.register(BraceletType)
admin.site.register(PurchaseReceipt)
