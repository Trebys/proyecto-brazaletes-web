from decimal import Decimal

from rest_framework import status
from rest_framework.authtoken.models import Token
from rest_framework.test import APITestCase

from login.models import User

from .models import Testimonial


class TestimonialApiTests(APITestCase):
    def setUp(self):
        self.client_user = User.objects.create_user(
            username='cliente_testimonio',
            email='cliente_testimonio@test.com',
            password='secret123',
            first_name='Cliente',
            last_name='Feliz',
            account_balance=Decimal('0.00'),
        )
        self.other_user = User.objects.create_user(
            username='otro_cliente',
            email='otro_cliente@test.com',
            password='secret123',
        )
        self.admin_user = User.objects.create_user(
            username='admin_testimonios',
            email='admin_testimonios@test.com',
            password='secret123',
            is_staff=True,
        )
        self.client_token = Token.objects.create(user=self.client_user)
        self.admin_token = Token.objects.create(user=self.admin_user)

    def test_public_list_only_returns_published_testimonials(self):
        published = Testimonial.objects.create(
            user=self.client_user,
            comment='La visita fue excelente y muy organizada.',
            rating=5,
            status=Testimonial.STATUS_PUBLISHED,
        )
        Testimonial.objects.create(
            user=self.other_user,
            comment='Este comentario todavia requiere revision.',
            rating=4,
            status=Testimonial.STATUS_PENDING,
        )

        response = self.client.get('/api/testimonios/')

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]['id'], published.id)
        self.assertEqual(response.data[0]['visible_name'], 'Cliente Feliz')

    def test_authenticated_client_can_create_pending_testimonial(self):
        self.client.credentials(HTTP_AUTHORIZATION=f'Token {self.client_token.key}')

        response = self.client.post(
            '/api/testimonios/',
            {
                'comment': 'Nos encanto el parque y la compra fue muy facil.',
                'rating': 5,
                'status': Testimonial.STATUS_PUBLISHED,
            },
            format='json',
        )

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        testimonial = Testimonial.objects.get(id=response.data['id'])
        self.assertEqual(testimonial.user, self.client_user)
        self.assertEqual(testimonial.status, Testimonial.STATUS_PENDING)
        self.assertEqual(response.data['status'], Testimonial.STATUS_PENDING)

    def test_anonymous_user_cannot_create_testimonial(self):
        response = self.client.post(
            '/api/testimonios/',
            {
                'comment': 'Un comentario suficientemente largo.',
                'rating': 4,
            },
            format='json',
        )

        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_rating_must_be_between_one_and_five(self):
        self.client.credentials(HTTP_AUTHORIZATION=f'Token {self.client_token.key}')

        response = self.client.post(
            '/api/testimonios/',
            {
                'comment': 'Un comentario suficientemente largo.',
                'rating': 6,
            },
            format='json',
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('rating', response.data)

    def test_admin_can_moderate_testimonial(self):
        testimonial = Testimonial.objects.create(
            user=self.client_user,
            comment='Queremos publicar esta experiencia positiva.',
            rating=5,
        )
        self.client.credentials(HTTP_AUTHORIZATION=f'Token {self.admin_token.key}')

        response = self.client.patch(
            f'/api/testimonios/{testimonial.id}/',
            {
                'status': Testimonial.STATUS_PUBLISHED,
                'moderation_note': 'Aprobado para home.',
            },
            format='json',
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        testimonial.refresh_from_db()
        self.assertEqual(testimonial.status, Testimonial.STATUS_PUBLISHED)
        self.assertEqual(testimonial.moderation_note, 'Aprobado para home.')

    def test_client_cannot_update_testimonial_status(self):
        testimonial = Testimonial.objects.create(
            user=self.client_user,
            comment='Este comentario queda pendiente.',
            rating=4,
        )
        self.client.credentials(HTTP_AUTHORIZATION=f'Token {self.client_token.key}')

        response = self.client.patch(
            f'/api/testimonios/{testimonial.id}/',
            {'status': Testimonial.STATUS_PUBLISHED},
            format='json',
        )

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        testimonial.refresh_from_db()
        self.assertEqual(testimonial.status, Testimonial.STATUS_PENDING)
