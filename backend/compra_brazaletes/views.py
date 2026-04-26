import json
import logging
from decimal import Decimal

import requests
from django.conf import settings
from django.core.exceptions import ImproperlyConfigured
from django.db import transaction
from paypalhttp.http_error import HttpError
from paypalcheckoutsdk.orders import (
    OrdersCaptureRequest,
    OrdersCreateRequest,
    OrdersGetRequest,
)
from rest_framework import permissions, status, viewsets
from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework.views import APIView

from login.permissions import IsAdminUserReal, ReadOnlyOrAdminUser, has_backoffice_access

from .models import Bracelet, BraceletTransaction, BraceletType, PurchaseReceipt
from .paypal_client import PayPalClient
from .serializers import (
    BraceletSerializer,
    BraceletTransactionSerializer,
    BraceletTypeSerializer,
    PurchaseReceiptSerializer,
)


logger = logging.getLogger(__name__)

PAYPAL_EVENT_STATUS_MAP = {
    'CHECKOUT.ORDER.APPROVED': PurchaseReceipt.STATUS_APPROVED,
    'CHECKOUT.ORDER.COMPLETED': PurchaseReceipt.STATUS_CAPTURED,
    'PAYMENT.CAPTURE.COMPLETED': PurchaseReceipt.STATUS_CAPTURED,
}

PAYPAL_STATUS_ORDER = {
    PurchaseReceipt.STATUS_PENDING: 0,
    PurchaseReceipt.STATUS_APPROVED: 1,
    PurchaseReceipt.STATUS_CAPTURED: 2,
}

PAYPAL_CONFIGURATION_ERROR_DETAIL = (
    "PayPal rejected the configured credentials. "
    "Check PAYPAL_CLIENT_ID, PAYPAL_CLIENT_SECRET and PAYPAL_ENV."
)
PAYPAL_PROVIDER_ERROR_DETAIL = "PayPal is not available right now."


def create_bracelet_for_type(bracelet_type):
    return Bracelet.objects.create(
        bracelet_type=bracelet_type,
        current_balance=bracelet_type.food_balance,
        attraction_uses_remaining=bracelet_type.attraction_uses,
    )


def verify_order(order_id):
    """
    Llama a la API de PayPal para obtener detalles de la orden.
    Devuelve el objeto 'order_info' (response.result).
    """
    client = PayPalClient().client
    get_request = OrdersGetRequest(order_id)
    response = client.execute(get_request)
    return response.result


def should_update_receipt_status(current_status, next_status):
    if current_status == PurchaseReceipt.STATUS_REFUNDED:
        return False

    return PAYPAL_STATUS_ORDER.get(next_status, -1) > PAYPAL_STATUS_ORDER.get(current_status, -1)


def update_paypal_receipt_status(order_id, next_status):
    receipt = PurchaseReceipt.objects.filter(
        paypal_order_id=order_id,
        payment_method=PurchaseReceipt.PAYMENT_METHOD_PAYPAL,
    ).first()

    if not receipt:
        logger.warning(
            "PayPal webhook received for order %s but no PurchaseReceipt was found.",
            order_id,
        )
        return

    if not should_update_receipt_status(receipt.status, next_status):
        logger.info(
            "Skipping PayPal status change for receipt %s: %s -> %s.",
            receipt.id,
            receipt.status,
            next_status,
        )
        return

    previous_status = receipt.status
    receipt.status = next_status
    receipt.save(update_fields=['status'])
    logger.info(
        "PurchaseReceipt %s updated from %s to %s via PayPal webhook.",
        receipt.id,
        previous_status,
        next_status,
    )


def extract_paypal_order_id(event_type, resource):
    if event_type == 'PAYMENT.CAPTURE.COMPLETED':
        return (
            resource.get('supplementary_data', {})
            .get('related_ids', {})
            .get('order_id')
        )

    return resource.get('id')


def build_paypal_error_response(error, context_message):
    if isinstance(error, ImproperlyConfigured):
        logger.error("%s PayPal configuration is incomplete: %s", context_message, error)
        return Response(
            {"detail": PAYPAL_CONFIGURATION_ERROR_DETAIL},
            status=status.HTTP_502_BAD_GATEWAY,
        )

    if isinstance(error, HttpError):
        logger.warning(
            "%s PayPal responded with HTTP %s: %s",
            context_message,
            error.status_code,
            error.message,
        )
        detail = (
            PAYPAL_CONFIGURATION_ERROR_DETAIL
            if error.status_code == 401
            else PAYPAL_PROVIDER_ERROR_DETAIL
        )
        return Response({"detail": detail}, status=status.HTTP_502_BAD_GATEWAY)

    logger.exception("%s Unexpected PayPal error.", context_message)
    return Response(
        {"detail": PAYPAL_PROVIDER_ERROR_DETAIL},
        status=status.HTTP_502_BAD_GATEWAY,
    )


class BraceletTypeViewSet(viewsets.ModelViewSet):
    serializer_class = BraceletTypeSerializer
    permission_classes = [ReadOnlyOrAdminUser]

    def get_queryset(self):
        queryset = BraceletType.objects.all().order_by('id')

        if has_backoffice_access(self.request.user):
            if self.action != 'list':
                return queryset

            include_inactive = self.request.query_params.get('include_inactive')
            if include_inactive in ('1', 'true', 'True', 'yes'):
                return queryset

        return queryset.filter(is_active=True)

    def destroy(self, request, *args, **kwargs):
        bracelet_type = self.get_object()

        if bracelet_type.bracelets.exists():
            return Response(
                {
                    "detail": (
                        "Este tipo ya tiene brazaletes asociados. "
                        "Desactivalo para retirarlo de la compra sin perder historial."
                    )
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        return super().destroy(request, *args, **kwargs)


class BraceletViewSet(viewsets.ModelViewSet):
    queryset = Bracelet.objects.all()
    serializer_class = BraceletSerializer
    permission_classes = [IsAdminUserReal]


class BraceletTransactionViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = BraceletTransactionSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        queryset = BraceletTransaction.objects.select_related(
            'bracelet',
            'bracelet__bracelet_type',
            'owner',
            'performed_by',
            'attraction',
            'food',
        )

        if has_backoffice_access(self.request.user):
            return queryset

        return queryset.filter(owner=self.request.user)


class PurchaseReceiptViewSet(viewsets.ModelViewSet):
    queryset = PurchaseReceipt.objects.all()
    serializer_class = PurchaseReceiptSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        if has_backoffice_access(self.request.user):
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
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            bracelet_type = BraceletType.objects.get(pk=bracelet_type_id, is_active=True)
        except BraceletType.DoesNotExist:
            return Response(
                {"detail": f"BraceletType {bracelet_type_id} does not exist."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        user = request.user
        if user.account_balance is None:
            user.account_balance = Decimal('0.00')

        price = bracelet_type.price
        if user.account_balance < price:
            return Response(
                {"detail": "Saldo insuficiente para comprar este brazalete."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        with transaction.atomic():
            user.account_balance -= price
            user.save(update_fields=['account_balance'])

            new_bracelet = create_bracelet_for_type(bracelet_type)
            new_receipt = PurchaseReceipt.objects.create(
                user=user,
                bracelet=new_bracelet,
                payment_method=PurchaseReceipt.PAYMENT_METHOD_INTERNAL,
                amount_paid=price,
                status=PurchaseReceipt.STATUS_CAPTURED,
            )

        serializer = self.get_serializer(new_receipt)
        return Response(serializer.data, status=status.HTTP_201_CREATED)


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

    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        amount = request.data.get("amount", "0.00")
        currency = request.data.get("currency", "USD")
        description = request.data.get("description", "Brazalete")

        create_request = OrdersCreateRequest()
        create_request.prefer('return=representation')
        create_request.request_body({
            "intent": "CAPTURE",
            "purchase_units": [
                {
                    "amount": {
                        "currency_code": currency,
                        "value": amount,
                    },
                    "description": description,
                }
            ],
        })

        try:
            paypal_client = PayPalClient().client
            response = paypal_client.execute(create_request)
            order = response.result
            return Response({
                "id": order.id,
                "status": order.status,
                "links": [link.href for link in order.links],
            }, status=status.HTTP_201_CREATED)
        except Exception as error:
            return build_paypal_error_response(error, "Error creating PayPal order.")


class PayPalCaptureOrderView(APIView):
    """
    Captura la orden en PayPal, confirmando el pago.
    Espera:
      { "orderID": "...", "bracelet_type_id": 1 }
    """

    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        order_id = request.data.get("orderID")
        bracelet_type_id = request.data.get("bracelet_type_id")

        if not order_id:
            return Response(
                {"detail": "orderID is required."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if not bracelet_type_id:
            return Response(
                {"detail": "bracelet_type_id is required for the internal record."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            bracelet_type = BraceletType.objects.get(pk=bracelet_type_id, is_active=True)
        except BraceletType.DoesNotExist:
            return Response(
                {"detail": f"BraceletType {bracelet_type_id} does not exist."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            order_info = verify_order(order_id)
        except Exception:
            logger.exception("Error verifying PayPal order %s before capture.", order_id)
            return Response(
                {"detail": "Unable to verify PayPal order before capture."},
                status=status.HTTP_502_BAD_GATEWAY,
            )

        if order_info.status not in ("APPROVED", "COMPLETED"):
            return Response(
                {
                    "detail": (
                        f"PayPal order is in status {order_info.status} "
                        "and cannot be captured."
                    )
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        capture_request = OrdersCaptureRequest(order_id)
        capture_request.request_body({})
        try:
            paypal_client = PayPalClient().client
            response = paypal_client.execute(capture_request)
        except Exception as error:
            return build_paypal_error_response(
                error,
                f"Error capturing PayPal order {order_id}.",
            )

        order = response.result
        if order.status != "COMPLETED":
            return Response(
                {"detail": f"PayPal order ended with status {order.status}."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        captured_value_str = order.purchase_units[0].payments.captures[0].amount.value
        captured_value = Decimal(captured_value_str)

        with transaction.atomic():
            new_bracelet = create_bracelet_for_type(bracelet_type)
            new_receipt = PurchaseReceipt.objects.create(
                user=request.user,
                bracelet=new_bracelet,
                payment_method=PurchaseReceipt.PAYMENT_METHOD_PAYPAL,
                paypal_order_id=order.id,
                amount_paid=captured_value,
                status=PurchaseReceipt.STATUS_CAPTURED,
            )

        return Response({
            "id": order.id,
            "status": order.status,
            "receipt_id": new_receipt.id,
            "purchase_units": [{"amount": captured_value_str}],
        }, status=status.HTTP_200_OK)


@api_view(['POST'])
def paypal_webhook(request):
    """
    PayPal enviará un POST aquí cuando sucedan eventos relevantes del pago.
    """
    raw_body = request.body

    transmission_id = request.META.get('HTTP_PAYPAL_TRANSMISSION_ID')
    transmission_sig = request.META.get('HTTP_PAYPAL_TRANSMISSION_SIG')
    transmission_time = request.META.get('HTTP_PAYPAL_TRANSMISSION_TIME')
    cert_url = request.META.get('HTTP_PAYPAL_CERT_URL')
    auth_algo = request.META.get('HTTP_PAYPAL_AUTH_ALGO')

    if not all([transmission_id, transmission_sig, transmission_time, cert_url, auth_algo]):
        logger.warning("PayPal webhook rejected because required headers are missing.")
        return Response(
            {"detail": "Missing required PayPal headers."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    try:
        event_json = json.loads(raw_body.decode('utf-8'))
    except json.JSONDecodeError:
        logger.warning("PayPal webhook rejected because payload is not valid JSON.")
        return Response(
            {"detail": "Invalid PayPal webhook payload."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    verify_payload = {
        "transmission_id": transmission_id,
        "transmission_time": transmission_time,
        "transmission_sig": transmission_sig,
        "cert_url": cert_url,
        "auth_algo": auth_algo,
        "webhook_id": settings.PAYPAL_WEBHOOK_ID,
        "webhook_event": event_json,
    }

    paypal_client = PayPalClient()
    try:
        access_token = paypal_client.get_access_token()
        verification_response = requests.post(
            f"{paypal_client.base_url}/v1/notifications/verify-webhook-signature",
            headers={
                "Content-Type": "application/json",
                "Authorization": f"Bearer {access_token}",
            },
            json=verify_payload,
            timeout=10,
        )
        verification_response.raise_for_status()
        verification_data = verification_response.json()
    except Exception:
        logger.exception("Unable to verify PayPal webhook signature.")
        return Response(
            {"detail": "Unable to verify PayPal webhook signature."},
            status=status.HTTP_502_BAD_GATEWAY,
        )

    if verification_data.get("verification_status") != "SUCCESS":
        logger.warning("PayPal webhook rejected due to invalid signature: %s", verification_data)
        return Response(
            {"detail": "Invalid PayPal webhook signature."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    event_type = event_json.get('event_type')
    resource = event_json.get('resource', {})
    next_status = PAYPAL_EVENT_STATUS_MAP.get(event_type)

    if not next_status:
        logger.info("Ignoring unsupported PayPal webhook event %s.", event_type)
        return Response(status=status.HTTP_200_OK)

    order_id = extract_paypal_order_id(event_type, resource)
    if not order_id:
        logger.warning(
            "PayPal webhook event %s did not include an order ID.",
            event_type,
        )
        return Response(status=status.HTTP_200_OK)

    update_paypal_receipt_status(order_id, next_status)
    return Response(status=status.HTTP_200_OK)
