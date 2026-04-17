import base64
from decimal import Decimal

from django.core.files.uploadedfile import SimpleUploadedFile
from rest_framework import status
from rest_framework.authtoken.models import Token
from rest_framework.test import APITestCase

from atracciones_comidas.models import Attractions, Food
from compra_brazaletes.models import Bracelet, BraceletType, PurchaseReceipt
from login.models import User


PNG_BYTES = base64.b64decode(
    'R0lGODdhAQABAIAAAP///////ywAAAAAAQABAAACAkQBADs='
)


def build_test_image(name):
    return SimpleUploadedFile(name, PNG_BYTES, content_type='image/png')


class AtraccionesComidasApiTests(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            username='cliente-ac',
            email='cliente-ac@test.com',
            password='secret123',
            account_balance=Decimal('30.00'),
        )
        self.admin = User.objects.create_user(
            username='admin-ac',
            email='admin-ac@test.com',
            password='secret123',
            is_staff=True,
        )
        self.user_token = Token.objects.create(user=self.user)
        self.admin_token = Token.objects.create(user=self.admin)

        self.bracelet_type = BraceletType.objects.create(
            name='Aventura',
            price=Decimal('49.99'),
            attraction_uses=5,
            food_balance=Decimal('12.00'),
        )
        self.bracelet = Bracelet.objects.create(
            bracelet_type=self.bracelet_type,
            current_balance=Decimal('12.00'),
            attraction_uses_remaining=5,
        )
        PurchaseReceipt.objects.create(
            user=self.user,
            bracelet=self.bracelet,
            payment_method=PurchaseReceipt.PAYMENT_METHOD_INTERNAL,
            amount_paid=self.bracelet_type.price,
            status=PurchaseReceipt.STATUS_CAPTURED,
        )

    def authenticate_user(self):
        self.client.credentials(HTTP_AUTHORIZATION=f'Token {self.user_token.key}')

    def authenticate_admin(self):
        self.client.credentials(HTTP_AUTHORIZATION=f'Token {self.admin_token.key}')

    def test_food_list_uses_food_serializer_fields(self):
        Food.objects.create(
            name='Pizza',
            description='Pizza familiar',
            photo=build_test_image('pizza.png'),
            price=Decimal('9.50'),
        )

        response = self.client.get('/api/atracciones-comidas/foods/')

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data[0]['price'], '9.50')
        self.assertIn('photo_url', response.data[0])
        self.assertNotIn('usage_points', response.data[0])

    def test_admin_can_create_attraction(self):
        self.authenticate_admin()

        response = self.client.post(
            '/api/atracciones-comidas/attractions/',
            {
                'name': 'Dragon Volador',
                'description': 'Montana rusa extrema',
                'usage_points': 2,
                'photo': build_test_image('dragon.png'),
            },
            format='multipart',
        )

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertTrue(Attractions.objects.filter(name='Dragon Volador').exists())

    def test_admin_can_create_food(self):
        self.authenticate_admin()

        response = self.client.post(
            '/api/atracciones-comidas/foods/',
            {
                'name': 'Hamburguesa',
                'description': 'Combo especial',
                'price': '8.00',
                'photo': build_test_image('burger.png'),
            },
            format='multipart',
        )

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertTrue(Food.objects.filter(name='Hamburguesa').exists())

    def test_regular_user_cannot_create_food(self):
        self.authenticate_user()

        response = self.client.post(
            '/api/atracciones-comidas/foods/',
            {
                'name': 'Helado',
                'description': 'Postre frio',
                'price': '5.00',
                'photo': build_test_image('icecream.png'),
            },
            format='multipart',
        )

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_authenticated_user_can_consume_attraction_with_owned_bracelet(self):
        attraction = Attractions.objects.create(
            name='Carrusel',
            description='Atraccion familiar',
            photo=build_test_image('carrusel.png'),
            usage_points=2,
        )
        self.authenticate_user()

        response = self.client.post(
            f'/api/atracciones-comidas/attractions/{attraction.id}/consume/',
            {'bracelet_id': self.bracelet.id},
            format='json',
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.bracelet.refresh_from_db()
        self.assertEqual(self.bracelet.attraction_uses_remaining, 3)

    def test_food_purchase_can_fallback_to_account_balance(self):
        food = Food.objects.create(
            name='Pizza grande',
            description='Porcion grande',
            photo=build_test_image('pizza-grande.png'),
            price=Decimal('15.00'),
        )
        self.authenticate_user()

        bracelet_response = self.client.post(
            f'/api/atracciones-comidas/foods/{food.id}/purchase/',
            {
                'bracelet_id': self.bracelet.id,
                'payment_source': 'BRACELET_BALANCE',
            },
            format='json',
        )
        account_response = self.client.post(
            f'/api/atracciones-comidas/foods/{food.id}/purchase/',
            {
                'bracelet_id': self.bracelet.id,
                'payment_source': 'ACCOUNT_BALANCE',
            },
            format='json',
        )

        self.assertEqual(bracelet_response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertTrue(bracelet_response.data['fallback_available'])
        self.assertEqual(account_response.status_code, status.HTTP_200_OK)

        self.user.refresh_from_db()
        self.bracelet.refresh_from_db()
        self.assertEqual(self.user.account_balance, Decimal('15.00'))
        self.assertEqual(self.bracelet.current_balance, Decimal('12.00'))
