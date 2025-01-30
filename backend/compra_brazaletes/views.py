from paypalcheckoutsdk.orders import OrdersGetRequest
from rest_framework.decorators import api_view
from paypalcheckoutsdk.orders import OrdersCaptureRequest
from .paypal_client import PayPalClient
from paypalcheckoutsdk.orders import OrdersCreateRequest
from rest_framework import status
from rest_framework.views import APIView
from rest_framework import viewsets, permissions, status
from rest_framework.response import Response
from .models import BraceletType, Bracelet, PurchaseReceipt
from .serializers import (
    BraceletTypeSerializer,
    BraceletSerializer,
    PurchaseReceiptSerializer
)
from decimal import Decimal
import json
import requests
from django.conf import settings


class BraceletTypeViewSet(viewsets.ModelViewSet):
    queryset = BraceletType.objects.all()
    serializer_class = BraceletTypeSerializer
    permission_classes = [permissions.AllowAny]


class BraceletViewSet(viewsets.ModelViewSet):
    queryset = Bracelet.objects.all()
    serializer_class = BraceletSerializer
    permission_classes = [permissions.AllowAny]


class PurchaseReceiptViewSet(viewsets.ModelViewSet):
    queryset = PurchaseReceipt.objects.all()
    serializer_class = PurchaseReceiptSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        if self.request.user.is_superuser:
            return PurchaseReceipt.objects.all()
        return PurchaseReceipt.objects.filter(user=self.request.user)

    def create(self, request, *args, **kwargs):
        """
        Reemplaza el create por defecto. 
        Creación manual de Bracelet y PurchaseReceipt en un solo paso.
        """
        bracelet_type_id = request.data.get('bracelet_type_id')
        if not bracelet_type_id:
            return Response(
                {"detail": "bracelet_type_id is required."},
                status=status.HTTP_400_BAD_REQUEST
            )
# 1. Obtener el BraceletType
        try:
            btype = BraceletType.objects.get(pk=bracelet_type_id)
        except BraceletType.DoesNotExist:
            return Response(
                {"detail": f"BraceletType {bracelet_type_id} does not exist."},
                status=status.HTTP_400_BAD_REQUEST
            )
        # Verificar saldo del usuario
        user = request.user  # Modelo login.User con account_balance
        if user.account_balance is None:
            # Si por alguna razón está en None, lo tratamos como 0
            user.account_balance = Decimal('0.00')

        # Descontar el saldo
        price = btype.price  # precio del brazalete
        if user.account_balance < price:
            return Response(
                {"detail": "Saldo insuficiente para comprar este brazalete."},
                status=status.HTTP_400_BAD_REQUEST
            )

        # 3. Descontar el saldo
        user.account_balance -= price
        user.save(update_fields=['account_balance'])

        # 4. Crear el Bracelet (con saldo de comida y usos de atracciones)
        new_bracelet = Bracelet.objects.create(
            bracelet_type=btype,
            current_balance=btype.food_balance,
            attraction_uses_remaining=btype.attraction_uses
        )
# 5. Crear el PurchaseReceipt
        new_receipt = PurchaseReceipt.objects.create(
            user=user,
            bracelet=new_bracelet,
            payment_method='INTERNAL',
            amount_paid=price,  # Guardamos el precio pagado
            # O 'CAPTURED' si consideras que el saldo interno ya se descuenta al instante
            status='CREATED'
        )
# 6. Retornar la compra con el serializer
        serializer = self.get_serializer(new_receipt)
        return Response(serializer.data, status=status.HTTP_201_CREATED)


# Procesos de Pagos con PayPal

def verify_order(order_id):
    """
    Llama a la API de PayPal para obtener detalles de la orden.
    Devuelve el objeto 'order_info' (response.result).
    """
    client = PayPalClient().client  # Donde configuras tu client_id/secret
    get_request = OrdersGetRequest(order_id)
    # Realiza la llamada "GET /v2/checkout/orders/{order_id}"
    response = client.execute(get_request)
    return response.result  # order_info


class PayPalCreateOrderView(APIView):
    """
    Crea una orden de PayPal en Sandbox/Live.
    Espera en el body:
      {
        "amount": "25.00",
        "currency": "USD",
        "description": "Compra de brazalete Premium"
      }
    """

    def post(self, request):
        amount = request.data.get("amount", "0.00")
        currency = request.data.get("currency", "USD")
        description = request.data.get("description", "Brazalete")

        # 1. Crear la request de PayPal
        create_request = OrdersCreateRequest()
        create_request.prefer('return=representation')
        create_request.request_body({
            "intent": "CAPTURE",
            "purchase_units": [
                {
                    "amount": {
                        "currency_code": currency,
                        "value": amount
                    },
                    "description": description
                }
            ]
        })

        # 2. Ejecutar la request
        paypal_client = PayPalClient().client
        try:
            response = paypal_client.execute(create_request)
            order = response.result  # Contiene el resultado

            # Retornamos el 'order.id' y otros datos
            return Response({
                "id": order.id,
                "status": order.status,
                "links": [link.href for link in order.links],
            }, status=status.HTTP_201_CREATED)

        except Exception as e:
            print("Error creando orden PayPal:", e)
            return Response(
                {"detail": "Error creando orden PayPal"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class PayPalCaptureOrderView(APIView):
    """
    Captura la orden en PayPal, confirmando el pago.
    Espera:
      { "orderID": "..." }
    """

    def post(self, request):
        order_id = request.data.get("orderID")
        bracelet_type_id = request.data.get(
            "bracelet_type_id")  # supongamos que viene
        if not order_id:
            return Response({"detail": "orderID is required"}, status=400)

        # 1. Verificar la orden primero
        order_info = verify_order(order_id)  # Llamamos a nuestra función
        # order_info.status, order_info.purchase_units[0].amount.value, etc.

        # Puedes hacer checks:
        if order_info.status not in ("APPROVED", "COMPLETED"):
            return Response({"detail": f"La orden tiene estado {order_info.status}, no se puede capturar"}, status=400)

        capture_request = OrdersCaptureRequest(order_id)
        capture_request.request_body({})
        paypal_client = PayPalClient().client

        try:
            response = paypal_client.execute(capture_request)
            order = response.result

            if order.status == "COMPLETED":
                # 1. Obtener la info del brazalete
                if not bracelet_type_id:
                    return Response({"detail": "bracelet_type_id is required for internal record"}, status=400)

                # 2. Buscar el BraceletType (sin restar saldo usuario)
                try:
                    btype = BraceletType.objects.get(pk=bracelet_type_id)
                except BraceletType.DoesNotExist:
                    return Response({"detail": f"BraceletType {bracelet_type_id} no existe"}, status=400)

                # 3. Crear el brazalete
                new_bracelet = Bracelet.objects.create(
                    bracelet_type=btype,
                    current_balance=btype.food_balance,
                    attraction_uses_remaining=btype.attraction_uses
                )

                # 4. Crear el PurchaseReceipt
                # Tomar el monto capturado (ej: "25.00")
                captured_value_str = order.purchase_units[0].payments.captures[0].amount.value
                captured_value = Decimal(captured_value_str)
                new_receipt = PurchaseReceipt.objects.create(
                    user=request.user,
                    bracelet=new_bracelet,
                    payment_method='PAYPAL',
                    paypal_order_id=order.id,  # order.id es el ID de PayPal
                    amount_paid=captured_value,
                    status='CREATED'  # en vez de 'CAPTURED'
                )

            # Retornar info al frontend
                return Response({
                    "id": order.id,
                    "status": order.status,
                    "receipt_id": new_receipt.id,
                    "purchase_units": [
                        {
                            "amount": captured_value_str
                        }
                    ]
                }, status=200)
            else:
                # Si no está COMPLETED
                return Response({"detail": f"Orden con estatus {order.status}, no se completó pago"}, status=400)

        except Exception as e:
            print("Error capturando orden PayPal:", e)
            return Response(
                {"detail": "Error capturando orden PayPal"},
                status=500
            )


@api_view(['POST'])
def paypal_webhook(request):
    """
    PayPal enviará un POST aquí cuando sucedan eventos como:
    - CHECKOUT.ORDER.APPROVED / COMPLETED
    - PAYMENT.CAPTURE.COMPLETED
    etc.
    """
    # 1) Obtener el cuerpo crudo:
    raw_body = request.body  # bytes

    # 2) Obtener encabezados que PayPal manda
    transmission_id = request.META.get('HTTP_PAYPAL_TRANSMISSION_ID')
    transmission_sig = request.META.get('HTTP_PAYPAL_TRANSMISSION_SIG')
    transmission_time = request.META.get('HTTP_PAYPAL_TRANSMISSION_TIME')
    cert_url = request.META.get('HTTP_PAYPAL_CERT_URL')
    auth_algo = request.META.get('HTTP_PAYPAL_AUTH_ALGO')

    if not all([transmission_id, transmission_sig, transmission_time, cert_url, auth_algo]):
        print("Faltan encabezados de PayPal para verificar firma.")
        return Response({"detail": "Missing PayPal headers."}, status=status.HTTP_400_BAD_REQUEST)

    # 3) Construir el payload para verify-webhook-signature
    try:
        event_json = json.loads(raw_body.decode('utf-8'))
    except json.JSONDecodeError:
        print("Error decodificando el cuerpo del webhook.")
        return Response({"detail": "Invalid JSON."}, status=status.HTTP_400_BAD_REQUEST)

    verify_payload = {
        "transmission_id": transmission_id,
        "transmission_time": transmission_time,
        "transmission_sig": transmission_sig,
        "cert_url": cert_url,
        "auth_algo": auth_algo,
        "webhook_id": settings.PAYPAL_WEBHOOK_ID,  # ID de tu webhook
        "webhook_event": event_json
    }

    # 4) Obtener un access_token
    paypal_client = PayPalClient()
    access_token = paypal_client.get_access_token()

    # 5) Llamar al endpoint /v1/notifications/verify-webhook-signature
    url = f"{paypal_client.base_url}/v1/notifications/verify-webhook-signature"
    headers = {
        "Content-Type": "application/json",
        "Authorization": f"Bearer {access_token}",
    }
    resp = requests.post(url, headers=headers, json=verify_payload)
    verification_data = resp.json()

    if verification_data.get("verification_status") != "SUCCESS":
        print("Firma NO válida:", verification_data)
        return Response({"detail": "Invalid signature"}, status=status.HTTP_400_BAD_REQUEST)

    # 6) Firma OK. Procesar el evento.
    event_type = event_json.get('event_type')
    resource = event_json.get('resource', {})

    print(f"== PayPal Webhook Received: {event_type} ==")

    if event_type == 'PAYMENT.CAPTURE.COMPLETED':
        # Obtener datos relevantes
        capture_id = resource.get('id')
        payer_email = resource.get('payee', {}).get('email_address')
        related_ids = resource.get(
            'supplementary_data', {}).get('related_ids', {})
        order_id = related_ids.get('order_id')

        print("Pago capturado:", capture_id, payer_email)

        if order_id:
            # Buscar el recibo en la base de datos
            receipt = PurchaseReceipt.objects.filter(
                paypal_order_id=order_id).first()
            if receipt:
                # Actualizar el estado a 'CAPTURED'
                receipt.status = 'CAPTURED'
                receipt.save()
                print(f"Receipt #{
                      receipt.id} actualizado a CAPTURED desde el webhook.")
            else:
                print(
                    f"No se encontró PurchaseReceipt con paypal_order_id={order_id}")
        else:
            print("No se encontró order_id en el JSON del webhook.")

    elif event_type == 'CHECKOUT.ORDER.COMPLETED':
        # Obtener el ID de la orden
        order_id = resource.get('id')
        print("Orden Completada:", order_id)

        if order_id:
            # Buscar el recibo en la base de datos
            receipt = PurchaseReceipt.objects.filter(
                paypal_order_id=order_id).first()
            if receipt:
                # Actualizar el estado a 'APPROVED'
                receipt.status = 'APPROVED'
                receipt.save()
                print(f"Receipt #{
                      receipt.id} actualizado a APPROVED desde el webhook.")
            else:
                print(
                    f"No se encontró PurchaseReceipt con paypal_order_id={order_id}")
        else:
            print("No se encontró order_id en el JSON del webhook.")

    # Otros tipos de eventos que desees manejar

    return Response(status=status.HTTP_200_OK)
