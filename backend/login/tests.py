from rest_framework import status
from rest_framework.authtoken.models import Token
from rest_framework.test import APITestCase

from .models import User


class UserPermissionsTests(APITestCase):
    def setUp(self):
        self.client_user = User.objects.create_user(
            username='cliente',
            email='cliente@test.com',
            password='secret123',
        )
        self.admin_user = User.objects.create_user(
            username='admin',
            email='admin@test.com',
            password='secret123',
            is_staff=True,
        )
        self.client_token = Token.objects.create(user=self.client_user)
        self.admin_token = Token.objects.create(user=self.admin_user)

    def test_users_endpoint_requires_authentication(self):
        response = self.client.get('/api/Users/')

        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_users_endpoint_forbids_non_admin_user(self):
        self.client.credentials(HTTP_AUTHORIZATION=f'Token {self.client_token.key}')

        response = self.client.get('/api/Users/')

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_users_endpoint_allows_admin_user(self):
        self.client.credentials(HTTP_AUTHORIZATION=f'Token {self.admin_token.key}')

        response = self.client.get('/api/Users/')

        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_user_profile_returns_role_flags(self):
        self.client.credentials(HTTP_AUTHORIZATION=f'Token {self.admin_token.key}')

        response = self.client.post('/api/user-profile')

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data['is_staff'])
        self.assertTrue(response.data['is_admin'])

    def test_is_admin_user_depends_on_is_staff(self):
        self.assertFalse(self.client_user.is_admin_user)
        self.assertTrue(self.admin_user.is_admin_user)

    def test_superuser_is_normalized_to_staff_on_save(self):
        superuser = User.objects.create_user(
            username='root',
            email='root@test.com',
            password='secret123',
            is_superuser=True,
            is_staff=False,
        )

        self.assertTrue(superuser.is_staff)
        self.assertTrue(superuser.is_admin_user)

    def test_register_client_returns_created_user_data(self):
        payload = {
            'username': 'nuevo_cliente',
            'first_name': 'Nuevo',
            'last_name': 'Cliente',
            'email': 'nuevo@test.com',
            'password': 'secret123',
            'account_balance': '150.00',
        }

        response = self.client.post('/api/register/', payload, format='json')

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertIn('Token', response.data)
        self.assertEqual(response.data['User']['username'], payload['username'])
        self.assertEqual(response.data['User']['email'], payload['email'])
        self.assertFalse(response.data['User']['is_admin'])
        self.assertNotIn('password', response.data['User'])

        created_user = User.objects.get(username=payload['username'])
        self.assertTrue(created_user.check_password(payload['password']))
