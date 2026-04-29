from decimal import Decimal
from types import SimpleNamespace
from unittest.mock import Mock, patch

from paypalhttp.http_error import HttpError
from rest_framework import status
from rest_framework.authtoken.models import Token
from rest_framework.test import APITestCase

from compra_brazaletes.models import (
    Bracelet,
    BraceletTransaction,
    BraceletType,
    PurchaseReceipt,
    Sale,
    SaleLine,
)
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
        self.receipt = PurchaseReceipt.objects.create(
            user=self.client_user,
            bracelet=self.bracelet,
            payment_method=PurchaseReceipt.PAYMENT_METHOD_INTERNAL,
            amount_paid=self.bracelet_type.price,
            status=PurchaseReceipt.STATUS_CAPTURED,
        )

    def authenticate_client(self):
        self.client.credentials(HTTP_AUTHORIZATION=f'Token {self.client_token.key}')

    def test_bracelet_type_list_is_public(self):
        response = self.client.get('/api/compra_brazaletes/tipos/')

        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_public_bracelet_type_list_hides_inactive_types(self):
        BraceletType.objects.create(
            name='Legacy',
            price=Decimal('10.00'),
            attraction_uses=1,
            food_balance=Decimal('5.00'),
            is_active=False,
        )

        response = self.client.get('/api/compra_brazaletes/tipos/')

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual([item['name'] for item in response.data], ['Premium'])

    def test_admin_can_list_inactive_bracelet_types(self):
        BraceletType.objects.create(
            name='Legacy',
            price=Decimal('10.00'),
            attraction_uses=1,
            food_balance=Decimal('5.00'),
            is_active=False,
        )
        self.client.credentials(HTTP_AUTHORIZATION=f'Token {self.admin_token.key}')

        response = self.client.get('/api/compra_brazaletes/tipos/?include_inactive=1')

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(
            {item['name'] for item in response.data},
            {'Premium', 'Legacy'},
        )

    def test_admin_can_deactivate_bracelet_type(self):
        self.client.credentials(HTTP_AUTHORIZATION=f'Token {self.admin_token.key}')

        response = self.client.patch(
            f'/api/compra_brazaletes/tipos/{self.bracelet_type.id}/',
            {'is_active': False},
            format='json',
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.bracelet_type.refresh_from_db()
        self.assertFalse(self.bracelet_type.is_active)

    def test_admin_can_reactivate_inactive_bracelet_type(self):
        self.bracelet_type.is_active = False
        self.bracelet_type.save(update_fields=['is_active'])
        self.client.credentials(HTTP_AUTHORIZATION=f'Token {self.admin_token.key}')

        response = self.client.patch(
            f'/api/compra_brazaletes/tipos/{self.bracelet_type.id}/',
            {'is_active': True},
            format='json',
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.bracelet_type.refresh_from_db()
        self.assertTrue(self.bracelet_type.is_active)

    def test_admin_cannot_delete_bracelet_type_with_bracelets(self):
        self.client.credentials(HTTP_AUTHORIZATION=f'Token {self.admin_token.key}')

        response = self.client.delete(
            f'/api/compra_brazaletes/tipos/{self.bracelet_type.id}/'
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertTrue(BraceletType.objects.filter(id=self.bracelet_type.id).exists())

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

    @patch('compra_brazaletes.views.PayPalClient')
    def test_paypal_order_creation_returns_bad_gateway_when_credentials_are_rejected(
        self,
        mock_paypal_client,
    ):
        self.authenticate_client()
        mock_paypal_client.return_value.client.execute.side_effect = HttpError(
            '{"error":"invalid_client","error_description":"Client Authentication failed"}',
            401,
            {},
        )

        response = self.client.post(
            '/api/compra_brazaletes/paypal/create-order/',
            {
                'amount': '49.99',
                'currency': 'USD',
                'description': 'Compra de brazalete',
            },
            format='json',
        )

        self.assertEqual(response.status_code, status.HTTP_502_BAD_GATEWAY)
        self.assertEqual(
            response.data['detail'],
            (
                'PayPal rejected the configured credentials. '
                'Check PAYPAL_CLIENT_ID, PAYPAL_CLIENT_SECRET and PAYPAL_ENV.'
            ),
        )

    def test_client_can_only_list_own_bracelet_transactions(self):
        other_user = User.objects.create_user(
            username='otro-cliente',
            email='otro@test.com',
            password='secret123',
        )
        other_bracelet = Bracelet.objects.create(
            bracelet_type=self.bracelet_type,
            current_balance=Decimal('25.00'),
            attraction_uses_remaining=2,
        )
        BraceletTransaction.objects.create(
            bracelet=self.bracelet,
            owner=self.client_user,
            performed_by=self.client_user,
            transaction_type=BraceletTransaction.TYPE_FOOD_CONSUMPTION,
            concept='Compra de comida: Pizza',
            balance_delta=Decimal('-8.00'),
            balance_before=Decimal('100.00'),
            balance_after=Decimal('92.00'),
            uses_before=10,
            uses_after=10,
        )
        BraceletTransaction.objects.create(
            bracelet=other_bracelet,
            owner=other_user,
            performed_by=other_user,
            transaction_type=BraceletTransaction.TYPE_ATTRACTION_CONSUMPTION,
            concept='Uso de atraccion: Carrusel',
            uses_delta=-1,
            balance_before=Decimal('25.00'),
            balance_after=Decimal('25.00'),
            uses_before=2,
            uses_after=1,
        )
        self.authenticate_client()

        response = self.client.get('/api/compra_brazaletes/transacciones/')

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]['owner']['id'], self.client_user.id)

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
        self.assertEqual(receipt.purchase_code, f'ORDER-{receipt.id}')
        self.assertEqual(receipt.bracelet.bracelet_code, f'BR-{receipt.bracelet.id}')
        self.assertEqual(
            receipt.bracelet.current_balance,
            self.bracelet_type.food_balance,
        )
        self.assertEqual(
            receipt.bracelet.attraction_uses_remaining,
            self.bracelet_type.attraction_uses,
        )
        self.assertEqual(receipt.bracelet.owner, self.client_user)

        sale = receipt.sale
        sale_line = sale.lines.get()
        activation = receipt.bracelet_transactions.get()

        self.assertEqual(sale.customer, self.client_user)
        self.assertEqual(sale.status, Sale.STATUS_CONFIRMED)
        self.assertEqual(sale.channel, Sale.CHANNEL_INTERNAL_BALANCE)
        self.assertEqual(sale.total_amount, self.bracelet_type.price)
        self.assertEqual(sale_line.bracelet, receipt.bracelet)
        self.assertEqual(sale_line.bracelet_type, self.bracelet_type)
        self.assertEqual(sale_line.quantity, 1)
        self.assertEqual(sale_line.unit_price, self.bracelet_type.price)
        self.assertEqual(sale_line.line_total, self.bracelet_type.price)
        self.assertEqual(
            sale_line.initial_food_balance,
            self.bracelet_type.food_balance,
        )
        self.assertEqual(
            sale_line.initial_attraction_uses,
            self.bracelet_type.attraction_uses,
        )
        self.assertEqual(activation.transaction_type, BraceletTransaction.TYPE_ACTIVATION)
        self.assertEqual(activation.sale, sale)
        self.assertEqual(activation.sale_line, sale_line)
        self.assertEqual(activation.receipt, receipt)
        self.assertEqual(activation.balance_before, Decimal('0.00'))
        self.assertEqual(activation.balance_after, self.bracelet_type.food_balance)
        self.assertEqual(activation.uses_before, 0)
        self.assertEqual(activation.uses_after, self.bracelet_type.attraction_uses)

    def test_internal_purchase_rejects_inactive_bracelet_type(self):
        self.bracelet_type.is_active = False
        self.bracelet_type.save(update_fields=['is_active'])
        self.authenticate_client()

        response = self.client.post(
            '/api/compra_brazaletes/recibos/',
            {'bracelet_type_id': self.bracelet_type.id},
            format='json',
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_internal_purchase_rejects_when_balance_is_not_enough(self):
        self.client_user.account_balance = Decimal('20.00')
        self.client_user.save(update_fields=['account_balance'])
        initial_receipt_count = PurchaseReceipt.objects.count()
        initial_bracelet_count = Bracelet.objects.count()
        initial_sale_count = Sale.objects.count()
        initial_sale_line_count = SaleLine.objects.count()
        initial_transaction_count = BraceletTransaction.objects.count()
        self.authenticate_client()

        response = self.client.post(
            '/api/compra_brazaletes/recibos/',
            {'bracelet_type_id': self.bracelet_type.id},
            format='json',
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(
            response.data['detail'],
            'Saldo insuficiente para comprar este brazalete.',
        )
        self.client_user.refresh_from_db()
        self.assertEqual(self.client_user.account_balance, Decimal('20.00'))
        self.assertEqual(PurchaseReceipt.objects.count(), initial_receipt_count)
        self.assertEqual(Bracelet.objects.count(), initial_bracelet_count)
        self.assertEqual(Sale.objects.count(), initial_sale_count)
        self.assertEqual(SaleLine.objects.count(), initial_sale_line_count)
        self.assertEqual(BraceletTransaction.objects.count(), initial_transaction_count)

    def test_admin_cannot_delete_receipt_with_commercial_sale(self):
        self.authenticate_client()
        purchase_response = self.client.post(
            '/api/compra_brazaletes/recibos/',
            {'bracelet_type_id': self.bracelet_type.id},
            format='json',
        )
        self.client.credentials(HTTP_AUTHORIZATION=f'Token {self.admin_token.key}')

        response = self.client.delete(
            f"/api/compra_brazaletes/recibos/{purchase_response.data['id']}/"
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertTrue(PurchaseReceipt.objects.filter(id=purchase_response.data['id']).exists())

    def test_admin_cannot_delete_bracelet_with_commercial_sale_line(self):
        self.authenticate_client()
        purchase_response = self.client.post(
            '/api/compra_brazaletes/recibos/',
            {'bracelet_type_id': self.bracelet_type.id},
            format='json',
        )
        receipt = PurchaseReceipt.objects.get(id=purchase_response.data['id'])
        self.client.credentials(HTTP_AUTHORIZATION=f'Token {self.admin_token.key}')

        response = self.client.delete(
            f'/api/compra_brazaletes/brazaletes/{receipt.bracelet_id}/'
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertTrue(Bracelet.objects.filter(id=receipt.bracelet_id).exists())

    def test_receipt_list_is_scoped_to_authenticated_user(self):
        other_user = User.objects.create_user(
            username='receipts-otro',
            email='receipts-otro@test.com',
            password='secret123',
        )
        other_bracelet = Bracelet.objects.create(
            bracelet_type=self.bracelet_type,
            current_balance=Decimal('40.00'),
            attraction_uses_remaining=4,
        )
        PurchaseReceipt.objects.create(
            user=other_user,
            bracelet=other_bracelet,
            payment_method=PurchaseReceipt.PAYMENT_METHOD_INTERNAL,
            amount_paid=Decimal('20.00'),
            status=PurchaseReceipt.STATUS_CAPTURED,
        )
        self.authenticate_client()

        response = self.client.get('/api/compra_brazaletes/recibos/')

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]['user']['id'], self.client_user.id)

    def test_paypal_capture_requires_bracelet_type_id(self):
        self.authenticate_client()

        response = self.client.post(
            '/api/compra_brazaletes/paypal/capture-order/',
            {'orderID': 'PAYPAL-ORDER-MISSING-TYPE'},
            format='json',
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(
            response.data['detail'],
            'bracelet_type_id is required for the internal record.',
        )

    @patch('compra_brazaletes.views.verify_order')
    def test_paypal_capture_rejects_unapproved_order(self, mock_verify_order):
        self.authenticate_client()
        mock_verify_order.return_value = SimpleNamespace(status='CREATED')

        response = self.client.post(
            '/api/compra_brazaletes/paypal/capture-order/',
            {
                'orderID': 'PAYPAL-ORDER-CREATED',
                'bracelet_type_id': self.bracelet_type.id,
            },
            format='json',
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(
            response.data['detail'],
            'PayPal order is in status CREATED and cannot be captured.',
        )

    @patch('compra_brazaletes.views.verify_order')
    def test_paypal_capture_returns_bad_gateway_when_verification_fails(self, mock_verify_order):
        self.authenticate_client()
        mock_verify_order.side_effect = Exception('paypal down')

        response = self.client.post(
            '/api/compra_brazaletes/paypal/capture-order/',
            {
                'orderID': 'PAYPAL-ORDER-VERIFY-ERR',
                'bracelet_type_id': self.bracelet_type.id,
            },
            format='json',
        )

        self.assertEqual(response.status_code, status.HTTP_502_BAD_GATEWAY)
        self.assertEqual(
            response.data['detail'],
            'Unable to verify PayPal order before capture.',
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
        self.assertEqual(receipt.purchase_code, f'ORDER-{receipt.id}')
        self.assertEqual(receipt.bracelet.bracelet_code, f'BR-{receipt.bracelet.id}')
        self.assertEqual(receipt.bracelet.owner, self.client_user)

        sale = receipt.sale
        sale_line = sale.lines.get()
        activation = receipt.bracelet_transactions.get()

        self.assertEqual(sale.customer, self.client_user)
        self.assertEqual(sale.status, Sale.STATUS_CONFIRMED)
        self.assertEqual(sale.channel, Sale.CHANNEL_PAYPAL)
        self.assertEqual(sale.total_amount, Decimal('49.99'))
        self.assertEqual(sale_line.bracelet, receipt.bracelet)
        self.assertEqual(sale_line.bracelet_type, self.bracelet_type)
        self.assertEqual(activation.transaction_type, BraceletTransaction.TYPE_ACTIVATION)
        self.assertEqual(activation.sale, sale)
        self.assertEqual(activation.sale_line, sale_line)
        self.assertEqual(activation.receipt, receipt)

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

    @patch('compra_brazaletes.views.requests.post')
    @patch('compra_brazaletes.views.PayPalClient')
    def test_paypal_webhook_marks_capture_completed_event_as_captured(
        self,
        mock_paypal_client,
        mock_requests_post,
    ):
        receipt = PurchaseReceipt.objects.create(
            user=self.client_user,
            bracelet=self.bracelet,
            payment_method=PurchaseReceipt.PAYMENT_METHOD_PAYPAL,
            paypal_order_id='PAYPAL-ORDER-5',
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
                'event_type': 'PAYMENT.CAPTURE.COMPLETED',
                'resource': {
                    'supplementary_data': {
                        'related_ids': {'order_id': 'PAYPAL-ORDER-5'}
                    }
                },
            },
            format='json',
            HTTP_PAYPAL_TRANSMISSION_ID='tx-3',
            HTTP_PAYPAL_TRANSMISSION_SIG='sig',
            HTTP_PAYPAL_TRANSMISSION_TIME='2026-04-08T12:00:00Z',
            HTTP_PAYPAL_CERT_URL='https://api-m.paypal.com/certs/cert.pem',
            HTTP_PAYPAL_AUTH_ALGO='SHA256withRSA',
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        receipt.refresh_from_db()
        self.assertEqual(receipt.status, PurchaseReceipt.STATUS_CAPTURED)

    @patch('compra_brazaletes.views.requests.post')
    @patch('compra_brazaletes.views.PayPalClient')
    def test_paypal_webhook_rejects_invalid_signature(self, mock_paypal_client, mock_requests_post):
        receipt = PurchaseReceipt.objects.create(
            user=self.client_user,
            bracelet=self.bracelet,
            payment_method=PurchaseReceipt.PAYMENT_METHOD_PAYPAL,
            paypal_order_id='PAYPAL-ORDER-6',
            amount_paid=Decimal('49.99'),
            status=PurchaseReceipt.STATUS_PENDING,
        )

        mock_paypal_client.return_value.base_url = 'https://api-m.sandbox.paypal.com'
        mock_paypal_client.return_value.get_access_token.return_value = 'fake-token'
        mock_response = Mock()
        mock_response.json.return_value = {'verification_status': 'FAILURE'}
        mock_response.raise_for_status.return_value = None
        mock_requests_post.return_value = mock_response

        response = self.client.post(
            '/api/compra_brazaletes/paypal/webhook/',
            {
                'event_type': 'CHECKOUT.ORDER.APPROVED',
                'resource': {'id': 'PAYPAL-ORDER-6'},
            },
            format='json',
            HTTP_PAYPAL_TRANSMISSION_ID='tx-4',
            HTTP_PAYPAL_TRANSMISSION_SIG='sig',
            HTTP_PAYPAL_TRANSMISSION_TIME='2026-04-08T12:00:00Z',
            HTTP_PAYPAL_CERT_URL='https://api-m.paypal.com/certs/cert.pem',
            HTTP_PAYPAL_AUTH_ALGO='SHA256withRSA',
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(response.data['detail'], 'Invalid PayPal webhook signature.')
        receipt.refresh_from_db()
        self.assertEqual(receipt.status, PurchaseReceipt.STATUS_PENDING)

    @patch('compra_brazaletes.views.requests.post')
    @patch('compra_brazaletes.views.PayPalClient')
    def test_paypal_webhook_returns_bad_gateway_when_signature_verification_fails(
        self,
        mock_paypal_client,
        mock_requests_post,
    ):
        receipt = PurchaseReceipt.objects.create(
            user=self.client_user,
            bracelet=self.bracelet,
            payment_method=PurchaseReceipt.PAYMENT_METHOD_PAYPAL,
            paypal_order_id='PAYPAL-ORDER-7',
            amount_paid=Decimal('49.99'),
            status=PurchaseReceipt.STATUS_PENDING,
        )

        mock_paypal_client.return_value.base_url = 'https://api-m.sandbox.paypal.com'
        mock_paypal_client.return_value.get_access_token.return_value = 'fake-token'
        mock_requests_post.side_effect = Exception('timeout')

        response = self.client.post(
            '/api/compra_brazaletes/paypal/webhook/',
            {
                'event_type': 'CHECKOUT.ORDER.APPROVED',
                'resource': {'id': 'PAYPAL-ORDER-7'},
            },
            format='json',
            HTTP_PAYPAL_TRANSMISSION_ID='tx-5',
            HTTP_PAYPAL_TRANSMISSION_SIG='sig',
            HTTP_PAYPAL_TRANSMISSION_TIME='2026-04-08T12:00:00Z',
            HTTP_PAYPAL_CERT_URL='https://api-m.paypal.com/certs/cert.pem',
            HTTP_PAYPAL_AUTH_ALGO='SHA256withRSA',
        )

        self.assertEqual(response.status_code, status.HTTP_502_BAD_GATEWAY)
        self.assertEqual(
            response.data['detail'],
            'Unable to verify PayPal webhook signature.',
        )
        receipt.refresh_from_db()
        self.assertEqual(receipt.status, PurchaseReceipt.STATUS_PENDING)

    def test_paypal_webhook_requires_paypal_headers(self):
        response = self.client.post(
            '/api/compra_brazaletes/paypal/webhook/',
            {'event_type': 'CHECKOUT.ORDER.APPROVED', 'resource': {'id': 'PAYPAL-ORDER-4'}},
            format='json',
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(response.data['detail'], 'Missing required PayPal headers.')

    def test_paypal_webhook_rejects_invalid_json_payload(self):
        response = self.client.generic(
            'POST',
            '/api/compra_brazaletes/paypal/webhook/',
            data='{"event_type": "CHECKOUT.ORDER.APPROVED",',
            content_type='application/json',
            HTTP_PAYPAL_TRANSMISSION_ID='tx-6',
            HTTP_PAYPAL_TRANSMISSION_SIG='sig',
            HTTP_PAYPAL_TRANSMISSION_TIME='2026-04-08T12:00:00Z',
            HTTP_PAYPAL_CERT_URL='https://api-m.paypal.com/certs/cert.pem',
            HTTP_PAYPAL_AUTH_ALGO='SHA256withRSA',
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(response.data['detail'], 'Invalid PayPal webhook payload.')
