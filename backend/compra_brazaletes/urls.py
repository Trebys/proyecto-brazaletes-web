from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    BraceletTypeViewSet,
    BraceletViewSet,
    PurchaseReceiptViewSet,
    PayPalCaptureOrderView,
    PayPalCreateOrderView,
    paypal_webhook
)

router = DefaultRouter()
router.register(r'tipos', BraceletTypeViewSet, basename='tipo_brazalete')
router.register(r'brazaletes', BraceletViewSet, basename='brazalete')
router.register(r'recibos', PurchaseReceiptViewSet, basename='recibo')

urlpatterns = [
    path('', include(router.urls)),
    path('paypal/create-order/',
         PayPalCreateOrderView.as_view(), name='paypal-create'),
    path('paypal/capture-order/',
         PayPalCaptureOrderView.as_view(), name='paypal-capture'),
    path('paypal/webhook/', paypal_webhook, name='paypal-webhook'),
]
