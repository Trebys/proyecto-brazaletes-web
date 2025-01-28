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
            user=request.user,
            bracelet=new_bracelet
        )
# 6. Retornar la compra con el serializer
        serializer = self.get_serializer(new_receipt)
        return Response(serializer.data, status=status.HTTP_201_CREATED)


# Procesos de Pagos con PayPal


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
                #    Indica "pagado con PayPal"
                new_receipt = PurchaseReceipt.objects.create(
                    user=request.user,
                    bracelet=new_bracelet
                    # si quieres, crea un campo en PurchaseReceipt: payment_method = 'PayPal'
                    # payment_method='PayPal'
                )

            # Retornar info al frontend
                return Response({
                    "id": order.id,
                    "status": order.status,
                    "receipt_id": new_receipt.id,
                    "purchase_units": [
                        {
                            "amount": pu.payments.captures[0].amount.value
                        } for pu in order.purchase_units
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
