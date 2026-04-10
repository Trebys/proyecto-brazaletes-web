from decimal import Decimal
from types import SimpleNamespace
from unittest.mock import Mock, patch

from rest_framework import status
from rest_framework.authtoken.models import Token
from rest_framework.test import APITestCase

from compra_brazaletes.models import Bracelet, BraceletType, PurchaseReceipt
from login.models import User


class BraceletPermissionsTests(APITestCase):
    def setUp(self):
        self.client_user = User.objects.create_user(
            username='cliente',
            email='cliente@test.com',
            password='secret123',
            account_balance=Decimal('120.00'),
        )
        self.admin_user = User.objects.create_user(
            username='admin',
            email='admin@test.com',
            password='secret123',
            is_staff=True,
        )
        self.client_token = Token.objects.create(user=self.client_user)
        self.admin_token = Token.objects.create(user=self.admin_user)

        self.bracelet_type = BraceletType.objects.create(
            name='Premium',
            price=Decimal('49.99'),
            attraction_uses=10,
            food_balance=Decimal('100.00'),
            description='Acceso premium',
        )
        self.bracelet = Bracelet.objects.create(
            bracelet_type=self.bracelet_type,
            current_balance=Decimal('100.00'),
            attraction_uses_remaining=10,
        )

    def authenticate_client(self):
        self.client.credentials(HTTP_AUTHORIZATION=f'Token {self.client_token.key}')

    def test_bracelet_type_list_is_public(self):
        response = self.client.get('/api/compra_brazaletes/tipos/')

        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_bracelet_type_create_requires_authentication(self):
        response = self.client.post(
            '/api/compra_brazaletes/tipos/',
            {
                'name': 'Gold',
                'price': '59.99',
                'attraction_uses': 12,
                'food_balance': '120.00',
            },
            format='json',
        )

        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_bracelet_type_create_forbids_non_admin_user(self):
        self.authenticate_client()

        response = self.client.post(
            '/api/compra_brazaletes/tipos/',
            {
                'name': 'Gold',
                'price': '59.99',
                'attraction_uses': 12,
                'food_balance': '120.00',
            },
            format='json',
        )

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_bracelet_list_requires_admin_privileges(self):
        response = self.client.get('/api/compra_brazaletes/brazaletes/')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

        self.authenticate_client()
        response = self.client.get('/api/compra_brazaletes/brazaletes/')
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

        self.client.credentials(HTTP_AUTHORIZATION=f'Token {self.admin_token.key}')
        response = self.client.get('/api/compra_brazaletes/brazaletes/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_paypal_order_creation_requires_authentication(self):
        response = self.client.post(
            '/api/compra_brazaletes/paypal/create-order/',
            {
                'amount': '49.99',
                'currency': 'USD',
                'description': 'Compra de brazalete',
            },
            format='json',
        )

        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_internal_purchase_creates_captured_receipt_and_debits_balance(self):
        self.authenticate_client()

        response = self.client.post(
            '/api/compra_brazaletes/recibos/',
            {'bracelet_type_id': self.bracelet_type.id},
            format='json',
        )

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

        receipt = PurchaseReceipt.objects.get(id=response.data['id'])
        self.client_user.refresh_from_db()

        self.assertEqual(receipt.payment_method, PurchaseReceipt.PAYMENT_METHOD_INTERNAL)
        self.assertEqual(receipt.status, PurchaseReceipt.STATUS_CAPTURED)
        self.assertEqual(receipt.amount_paid, self.bracelet_type.price)
        self.assertEqual(
            self.client_user.account_balance,
            Decimal('70.01'),
        )

    @patch('compra_brazaletes.views.PayPalClient')
    @patch('compra_brazaletes.views.verify_order')
    def test_paypal_capture_creates_captured_receipt(self, mock_verify_order, mock_paypal_client):
        self.authenticate_client()
        mock_verify_order.return_value = SimpleNamespace(status='APPROVED')

        paypal_order = SimpleNamespace(
            id='PAYPAL-ORDER-1',
            status='COMPLETED',
            purchase_units=[
                SimpleNamespace(
                    payments=SimpleNamespace(
                        captures=[
                            SimpleNamespace(
                                amount=SimpleNamespace(value='49.99')
                            )
                        ]
                    )
                )
            ],
        )
        mock_paypal_client.return_value.client.execute.return_value = SimpleNamespace(
            result=paypal_order
        )

        response = self.client.post(
            '/api/compra_brazaletes/paypal/capture-order/',
            {
                'orderID': 'PAYPAL-ORDER-1',
                'bracelet_type_id': self.bracelet_type.id,
            },
            format='json',
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)

        receipt = PurchaseReceipt.objects.get(id=response.data['receipt_id'])
        self.assertEqual(receipt.payment_method, PurchaseReceipt.PAYMENT_METHOD_PAYPAL)
        self.assertEqual(receipt.status, PurchaseReceipt.STATUS_CAPTURED)
        self.assertEqual(receipt.paypal_order_id, 'PAYPAL-ORDER-1')
        self.assertEqual(receipt.amount_paid, Decimal('49.99'))

    @patch('compra_brazaletes.views.requests.post')
    @patch('compra_brazaletes.views.PayPalClient')
    def test_paypal_webhook_updates_receipt_to_approved(self, mock_paypal_client, mock_requests_post):
        receipt = PurchaseReceipt.objects.create(
            user=self.client_user,
            bracelet=self.bracelet,
            payment_method=PurchaseReceipt.PAYMENT_METHOD_PAYPAL,
            paypal_order_id='PAYPAL-ORDER-2',
            amount_paid=Decimal('49.99'),
            status=PurchaseReceipt.STATUS_PENDING,
        )

        mock_paypal_client.return_value.base_url = 'https://api-m.sandbox.paypal.com'
        mock_paypal_client.return_value.get_access_token.return_value = 'fake-token'
        mock_response = Mock()
        mock_response.json.return_value = {'verification_status': 'SUCCESS'}
        mock_response.raise_for_status.return_value = None
        mock_requests_post.return_value = mock_response

        response = self.client.post(
            '/api/compra_brazaletes/paypal/webhook/',
            {
                'event_type': 'CHECKOUT.ORDER.APPROVED',
                'resource': {'id': 'PAYPAL-ORDER-2'},
            },
            format='json',
            HTTP_PAYPAL_TRANSMISSION_ID='tx-1',
            HTTP_PAYPAL_TRANSMISSION_SIG='sig',
            HTTP_PAYPAL_TRANSMISSION_TIME='2026-04-08T12:00:00Z',
            HTTP_PAYPAL_CERT_URL='https://api-m.paypal.com/certs/cert.pem',
            HTTP_PAYPAL_AUTH_ALGO='SHA256withRSA',
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        receipt.refresh_from_db()
        self.assertEqual(receipt.status, PurchaseReceipt.STATUS_APPROVED)

    @patch('compra_brazaletes.views.requests.post')
    @patch('compra_brazaletes.views.PayPalClient')
    def test_paypal_webhook_does_not_downgrade_captured_receipt(self, mock_paypal_client, mock_requests_post):
        receipt = PurchaseReceipt.objects.create(
            user=self.client_user,
            bracelet=self.bracelet,
            payment_method=PurchaseReceipt.PAYMENT_METHOD_PAYPAL,
            paypal_order_id='PAYPAL-ORDER-3',
            amount_paid=Decimal('49.99'),
            status=PurchaseReceipt.STATUS_CAPTURED,
        )

        mock_paypal_client.return_value.base_url = 'https://api-m.sandbox.paypal.com'
        mock_paypal_client.return_value.get_access_token.return_value = 'fake-token'
        mock_response = Mock()
        mock_response.json.return_value = {'verification_status': 'SUCCESS'}
        mock_response.raise_for_status.return_value = None
        mock_requests_post.return_value = mock_response

        response = self.client.post(
            '/api/compra_brazaletes/paypal/webhook/',
            {
                'event_type': 'CHECKOUT.ORDER.APPROVED',
                'resource': {'id': 'PAYPAL-ORDER-3'},
            },
            format='json',
            HTTP_PAYPAL_TRANSMISSION_ID='tx-2',
            HTTP_PAYPAL_TRANSMISSION_SIG='sig',
            HTTP_PAYPAL_TRANSMISSION_TIME='2026-04-08T12:00:00Z',
            HTTP_PAYPAL_CERT_URL='https://api-m.paypal.com/certs/cert.pem',
            HTTP_PAYPAL_AUTH_ALGO='SHA256withRSA',
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        receipt.refresh_from_db()
        self.assertEqual(receipt.status, PurchaseReceipt.STATUS_CAPTURED)

    def test_paypal_webhook_requires_paypal_headers(self):
        response = self.client.post(
            '/api/compra_brazaletes/paypal/webhook/',
            {'event_type': 'CHECKOUT.ORDER.APPROVED', 'resource': {'id': 'PAYPAL-ORDER-4'}},
            format='json',
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(response.data['detail'], 'Missing required PayPal headers.')
