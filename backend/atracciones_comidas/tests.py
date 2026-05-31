import base64
from decimal import Decimal

from django.core.files.uploadedfile import SimpleUploadedFile
from django.core.management import call_command
from django.test import TestCase
from rest_framework import status
from rest_framework.authtoken.models import Token
from rest_framework.test import APITestCase

from atracciones_comidas.models import Attractions, Food
from compra_brazaletes.models import (
    Bracelet,
    BraceletTransaction,
    BraceletType,
    PurchaseReceipt,
)
from login.models import User


PNG_BYTES = base64.b64decode(
    'R0lGODdhAQABAIAAAP///////ywAAAAAAQABAAACAkQBADs='
)


def build_test_image(name):
    return SimpleUploadedFile(name, PNG_BYTES, content_type='image/png')


class SeedAtraccionesComidasTests(TestCase):
    def test_seed_is_idempotent_and_can_preserve_existing_images(self):
        call_command('seed_atracciones_comidas', verbosity=0)

        attraction = Attractions.objects.get(name='Carrusel Encantado')
        attraction.photo = 'cloudinary/attractions/carrusel.jpg'
        attraction.save(update_fields=['photo'])

        food = Food.objects.get(name='Pizza Aventura')
        food.photo = 'cloudinary/foods/pizza.jpg'
        food.save(update_fields=['photo'])

        bracelet_type = BraceletType.objects.get(name='Premium')
        bracelet_type.image = 'cloudinary/bracelets/premium.jpg'
        bracelet_type.save(update_fields=['image'])

        call_command('seed_atracciones_comidas', '--preserve-images', verbosity=0)

        self.assertEqual(Attractions.objects.count(), 3)
        self.assertEqual(Food.objects.count(), 3)
        self.assertEqual(BraceletType.objects.count(), 3)
        attraction.refresh_from_db()
        food.refresh_from_db()
        bracelet_type.refresh_from_db()
        self.assertEqual(attraction.photo.name, 'cloudinary/attractions/carrusel.jpg')
        self.assertEqual(food.photo.name, 'cloudinary/foods/pizza.jpg')
        self.assertEqual(bracelet_type.image.name, 'cloudinary/bracelets/premium.jpg')
        self.assertEqual(
            set(BraceletType.objects.values_list('name', flat=True)),
            {'Estándar', 'Especial', 'Premium'},
        )


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
        movement = BraceletTransaction.objects.get(
            transaction_type=BraceletTransaction.TYPE_ATTRACTION_CONSUMPTION
        )
        self.assertEqual(movement.bracelet, self.bracelet)
        self.assertEqual(movement.owner, self.user)
        self.assertEqual(movement.attraction, attraction)
        self.assertEqual(movement.uses_delta, -2)
        self.assertEqual(movement.uses_before, 5)
        self.assertEqual(movement.uses_after, 3)

    def test_food_purchase_requires_bracelet_balance_and_audits_consumption(self):
        food = Food.objects.create(
            name='Pizza grande',
            description='Porcion grande',
            photo=build_test_image('pizza-grande.png'),
            price=Decimal('8.00'),
        )
        self.authenticate_user()

        response = self.client.post(
            f'/api/atracciones-comidas/foods/{food.id}/purchase/',
            {
                'bracelet_id': self.bracelet.id,
                'payment_source': 'BRACELET_BALANCE',
            },
            format='json',
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)

        self.user.refresh_from_db()
        self.bracelet.refresh_from_db()
        self.assertEqual(self.user.account_balance, Decimal('30.00'))
        self.assertEqual(self.bracelet.current_balance, Decimal('4.00'))

        movement = BraceletTransaction.objects.get(
            transaction_type=BraceletTransaction.TYPE_FOOD_CONSUMPTION
        )
        self.assertEqual(movement.bracelet, self.bracelet)
        self.assertEqual(movement.owner, self.user)
        self.assertEqual(movement.food, food)
        self.assertEqual(movement.balance_delta, Decimal('-8.00'))
        self.assertEqual(movement.balance_before, Decimal('12.00'))
        self.assertEqual(movement.balance_after, Decimal('4.00'))

    def test_food_purchase_is_blocked_when_bracelet_balance_is_not_enough(self):
        food = Food.objects.create(
            name='Pizza grande',
            description='Porcion grande',
            photo=build_test_image('pizza-grande.png'),
            price=Decimal('15.00'),
        )
        self.authenticate_user()

        response = self.client.post(
            f'/api/atracciones-comidas/foods/{food.id}/purchase/',
            {
                'bracelet_id': self.bracelet.id,
                'payment_source': 'BRACELET_BALANCE',
            },
            format='json',
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertFalse(response.data['fallback_available'])

        self.user.refresh_from_db()
        self.bracelet.refresh_from_db()
        self.assertEqual(self.user.account_balance, Decimal('30.00'))
        self.assertEqual(self.bracelet.current_balance, Decimal('12.00'))
        self.assertEqual(BraceletTransaction.objects.count(), 0)
