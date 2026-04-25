from decimal import Decimal

from django.test import override_settings
from django.utils import timezone
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
            account_balance=Decimal('0.00'),
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

    @override_settings(SESSION_IDLE_TIMEOUT_MINUTES=15)
    def test_login_allows_authentication_with_username(self):
        old_token_key = self.client_token.key

        response = self.client.post(
            '/api/login',
            {
                'identifier': self.client_user.username,
                'password': 'secret123',
            },
            format='json',
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['User']['id'], self.client_user.id)
        self.assertEqual(response.data['session']['idle_timeout_seconds'], 900)
        self.assertTrue(response.data['session']['replaced_existing_session'])
        self.assertNotEqual(response.data['Token'], old_token_key)
        self.assertFalse(Token.objects.filter(key=old_token_key).exists())
        self.assertTrue(Token.objects.filter(key=response.data['Token']).exists())

    def test_login_allows_authentication_with_email(self):
        response = self.client.post(
            '/api/login',
            {
                'identifier': self.client_user.email,
                'password': 'secret123',
            },
            format='json',
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['User']['email'], self.client_user.email)

    def test_login_rejects_wrong_password(self):
        response = self.client.post(
            '/api/login',
            {
                'identifier': self.client_user.username,
                'password': 'incorrecta',
            },
            format='json',
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(response.data['message'], 'Wrong password.')

    def test_login_requires_identifier_and_password(self):
        response = self.client.post('/api/login', {'identifier': ''}, format='json')

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(
            response.data['message'],
            'Username/Email and password are required.',
        )

    def test_client_cannot_update_own_account_balance_from_profile(self):
        self.client.credentials(HTTP_AUTHORIZATION=f'Token {self.client_token.key}')

        response = self.client.patch(
            '/api/edit-user',
            {
                'first_name': 'Cliente Actualizado',
                'account_balance': '999.99',
            },
            format='json',
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.client_user.refresh_from_db()
        self.assertEqual(self.client_user.first_name, 'Cliente Actualizado')
        self.assertEqual(str(self.client_user.account_balance), '0.00')

    def test_admin_can_update_own_account_balance_from_profile(self):
        self.admin_user.account_balance = '10.00'
        self.admin_user.save(update_fields=['account_balance'])
        self.client.credentials(HTTP_AUTHORIZATION=f'Token {self.admin_token.key}')

        response = self.client.patch(
            '/api/edit-user',
            {
                'account_balance': '250.50',
            },
            format='json',
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.admin_user.refresh_from_db()
        self.assertEqual(str(self.admin_user.account_balance), '250.50')

    def test_logout_deletes_current_token(self):
        self.client.credentials(HTTP_AUTHORIZATION=f'Token {self.client_token.key}')

        response = self.client.post('/api/logout')

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertFalse(Token.objects.filter(key=self.client_token.key).exists())

    @override_settings(SESSION_IDLE_TIMEOUT_MINUTES=15)
    def test_refresh_token_keeps_active_session_valid(self):
        original_created = self.client_token.created
        self.client.credentials(HTTP_AUTHORIZATION=f'Token {self.client_token.key}')

        response = self.client.post('/api/refresh-token/')

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['message'], 'Sesion vigente.')
        self.assertEqual(response.data['session']['idle_timeout_seconds'], 900)

        self.client_token.refresh_from_db()
        self.assertGreaterEqual(self.client_token.created, original_created)

    @override_settings(SESSION_IDLE_TIMEOUT_MINUTES=15)
    def test_expired_token_is_rejected_and_deleted(self):
        self.client_token.created = timezone.now() - timezone.timedelta(minutes=16)
        self.client_token.save(update_fields=['created'])
        self.client.credentials(HTTP_AUTHORIZATION=f'Token {self.client_token.key}')

        response = self.client.post('/api/user-profile')

        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
        self.assertIn('inactividad', str(response.data['detail']))
        self.assertFalse(Token.objects.filter(key=self.client_token.key).exists())

    def test_login_without_previous_session_reports_no_replacement(self):
        Token.objects.filter(user=self.client_user).delete()

        response = self.client.post(
            '/api/login',
            {
                'identifier': self.client_user.username,
                'password': 'secret123',
            },
            format='json',
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertFalse(response.data['session']['replaced_existing_session'])

    def test_previous_session_token_is_rejected_after_new_login(self):
        old_token_key = self.client_token.key
        self.client.post(
            '/api/login',
            {
                'identifier': self.client_user.username,
                'password': 'secret123',
            },
            format='json',
        )
        self.client.credentials(HTTP_AUTHORIZATION=f'Token {old_token_key}')

        response = self.client.post('/api/user-profile')

        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
        self.assertEqual(
            str(response.data['detail']),
            'Tu sesion ya no esta activa. Inicia sesion nuevamente.',
        )
