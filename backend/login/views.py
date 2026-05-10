import secrets
import logging

from django.conf import settings
from django.contrib.auth.hashers import check_password, make_password
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError as DjangoValidationError
from django.core.mail import EmailMultiAlternatives
from django.db import transaction
from django.utils import timezone
from django.utils.html import strip_tags
from django.views.decorators.csrf import csrf_exempt
from rest_framework import status, viewsets
from rest_framework.authtoken.models import Token
from rest_framework.decorators import (
    api_view,
    authentication_classes,
    parser_classes,
    permission_classes,
)
from rest_framework.parsers import FormParser, JSONParser, MultiPartParser
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from .authentication import (
    ExpiringTokenAuthentication,
    get_session_idle_timeout_seconds,
    is_token_expired,
)
from .models import ExpiringToken, User
from .models import PasswordResetCode
from .permissions import IsAdminUserReal, has_backoffice_access
from .serializers import (
    PasswordResetConfirmSerializer,
    PasswordResetRequestSerializer,
    UserSerializer,
)


logger = logging.getLogger(__name__)


class UserViewSet(viewsets.ModelViewSet):
    queryset = User.objects.all()
    permission_classes = [IsAdminUserReal]
    serializer_class = UserSerializer
    parser_classes = [JSONParser, FormParser, MultiPartParser]

    def destroy(self, request, *args, **kwargs):
        user = self.get_object()

        if user.is_staff:
            return Response(
                {'error': 'No se pueden eliminar usuarios administradores desde este panel.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        deactivate_user_account(user)
        return Response(status=status.HTTP_204_NO_CONTENT)


def build_session_payload(replaced_existing_session=False):
    return {
        'idle_timeout_seconds': get_session_idle_timeout_seconds(),
        'replaced_existing_session': replaced_existing_session,
    }


def deactivate_user_account(user):
    deleted_identifier = f'deleted-user-{user.pk}'

    with transaction.atomic():
        Token.objects.filter(user=user).delete()
        PasswordResetCode.objects.filter(user=user, used_at__isnull=True).update(
            used_at=timezone.now()
        )

        if user.profile_image:
            user.profile_image.delete(save=False)

        user.username = deleted_identifier
        user.email = f'{deleted_identifier}@deleted.local'
        user.first_name = 'Cuenta'
        user.last_name = 'eliminada'
        user.account_balance = 0
        user.profile_image = None
        user.is_active = False
        user.set_unusable_password()
        user.save(
            update_fields=[
                'username',
                'email',
                'first_name',
                'last_name',
                'account_balance',
                'profile_image',
                'is_active',
                'password',
            ]
        )


def build_password_reset_email(code, expiration_minutes):
    return f"""
    <div style="margin:0;background:#f3faf7;padding:24px;font-family:Arial,sans-serif;color:#0f2f2e;">
      <table role="presentation" width="100%" style="max-width:560px;margin:0 auto;border-collapse:collapse;background:#004C55;border-radius:12px;overflow:hidden;">
        <tr>
          <td style="padding:28px 28px 12px;color:#ffffff;">
            <p style="margin:0 0 8px;font-size:12px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:#f7d58b;">
              Fantasy Land
            </p>
            <h1 style="margin:0;font-size:28px;line-height:1.2;">Codigo para recuperar tu cuenta</h1>
          </td>
        </tr>
        <tr>
          <td style="padding:16px 28px 28px;color:#dff8f1;">
            <p style="margin:0 0 18px;font-size:15px;line-height:1.6;">
              Recibimos una solicitud para cambiar tu contrasena. Usa este codigo antes de que expire.
            </p>
            <div style="margin:20px 0;padding:18px;border-radius:10px;background:#ffffff;color:#004C55;text-align:center;font-size:34px;font-weight:800;letter-spacing:8px;">
              {code}
            </div>
            <p style="margin:0;font-size:14px;line-height:1.6;">
              El codigo vence en {expiration_minutes} minutos. Si no pediste este cambio, puedes ignorar este correo.
            </p>
          </td>
        </tr>
      </table>
    </div>
    """


def send_password_reset_email(user, code):
    expiration_minutes = settings.PASSWORD_RESET_CODE_EXPIRATION_MINUTES
    html_content = build_password_reset_email(code, expiration_minutes)
    message = EmailMultiAlternatives(
        subject='Tu codigo de recuperacion de Fantasy Land',
        body=strip_tags(html_content),
        from_email=settings.DEFAULT_FROM_EMAIL,
        to=[user.email],
    )
    message.attach_alternative(html_content, 'text/html')
    message.send(fail_silently=False)


@api_view(['POST'])
def login(request):
    identifier = request.data.get('identifier')
    password = request.data.get('password')

    if not identifier or not password:
        return Response(
            {'message': 'Username/Email and password are required.'},
            status=status.HTTP_400_BAD_REQUEST,
        )

    user = (
        User.objects.filter(username=identifier).first()
        or User.objects.filter(email=identifier).first()
    )

    if not user:
        return Response(
            {'message': 'User not found or does not exist.'},
            status=status.HTTP_404_NOT_FOUND,
        )

    if not user.check_password(password):
        return Response(
            {'message': 'Wrong password.'},
            status=status.HTTP_400_BAD_REQUEST,
        )

    existing_tokens = list(Token.objects.filter(user=user))
    had_active_session = any(not is_token_expired(token) for token in existing_tokens)
    Token.objects.filter(user=user).delete()
    token = Token.objects.create(user=user)
    serializer = UserSerializer(instance=user, context={'request': request})

    return Response(
        {
            'Token': token.key,
            'User': serializer.data,
            'session': build_session_payload(had_active_session),
            'message': (
                'Inicio de sesion correcto. Se cerro una sesion anterior.'
                if had_active_session
                else 'Inicio de sesion correcto.'
            ),
        },
        status=status.HTTP_200_OK,
    )


@api_view(['POST'])
def register_client(request):
    data = request.data.copy()
    if data.get('account_balance') in ('', None):
        data['account_balance'] = 0

    serializer = UserSerializer(data=data)

    if serializer.is_valid():
        validated_data = serializer.validated_data

        user = User(
            username=validated_data['username'],
            email=validated_data['email'],
            first_name=validated_data['first_name'],
            last_name=validated_data['last_name'],
            account_balance=validated_data.get('account_balance', 0),
        )

        user.set_password(validated_data['password'])
        user.save()

        token = ExpiringToken.objects.create(user=user)
        response_serializer = UserSerializer(instance=user, context={'request': request})

        return Response(
            {
                'Token': token.key,
                'User': response_serializer.data,
                'session': build_session_payload(False),
            },
            status=status.HTTP_201_CREATED,
        )

    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['POST'])
@permission_classes([])
def request_password_reset(request):
    serializer = PasswordResetRequestSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)

    username = serializer.validated_data['username']
    email = serializer.validated_data['email']
    user = User.objects.filter(
        username__iexact=username,
        email__iexact=email,
        is_active=True,
    ).first()

    if user:
        code = f'{secrets.randbelow(1000000):06d}'
        expiration = timezone.now() + timezone.timedelta(
            minutes=settings.PASSWORD_RESET_CODE_EXPIRATION_MINUTES
        )

        PasswordResetCode.objects.filter(user=user, used_at__isnull=True).update(
            used_at=timezone.now()
        )
        PasswordResetCode.objects.create(
            user=user,
            email=user.email.lower(),
            code_hash=make_password(code),
            expires_at=expiration,
        )
        try:
            send_password_reset_email(user, code)
        except Exception:
            logger.exception('Unable to send password reset email.')

    return Response(
        {
            'message': (
                'Si los datos coinciden, enviaremos un codigo para recuperar la cuenta.'
            )
        },
        status=status.HTTP_200_OK,
    )


@api_view(['POST'])
@permission_classes([])
def confirm_password_reset(request):
    serializer = PasswordResetConfirmSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)

    username = serializer.validated_data['username']
    email = serializer.validated_data['email']
    code = serializer.validated_data['code']
    new_password = serializer.validated_data['new_password']

    reset_code = (
        PasswordResetCode.objects.select_related('user')
        .filter(
            user__username__iexact=username,
            email__iexact=email,
            used_at__isnull=True,
        )
        .order_by('-created_at')
        .first()
    )

    if not reset_code:
        return Response(
            {'message': 'El codigo es invalido o ya fue usado.'},
            status=status.HTTP_400_BAD_REQUEST,
        )

    if reset_code.is_expired:
        reset_code.mark_used()
        return Response(
            {'message': 'El codigo ya vencio. Solicita uno nuevo.'},
            status=status.HTTP_400_BAD_REQUEST,
        )

    if reset_code.attempts >= settings.PASSWORD_RESET_MAX_ATTEMPTS:
        reset_code.mark_used()
        return Response(
            {'message': 'El codigo ya no esta disponible. Solicita uno nuevo.'},
            status=status.HTTP_400_BAD_REQUEST,
        )

    if not check_password(code, reset_code.code_hash):
        reset_code.attempts += 1
        reset_code.save(update_fields=['attempts'])
        return Response(
            {'message': 'El codigo es invalido.'},
            status=status.HTTP_400_BAD_REQUEST,
        )

    try:
        validate_password(new_password, reset_code.user)
    except DjangoValidationError as exc:
        return Response(
            {'new_password': list(exc.messages)},
            status=status.HTTP_400_BAD_REQUEST,
        )

    with transaction.atomic():
        reset_code.user.set_password(new_password)
        reset_code.user.save(update_fields=['password'])
        reset_code.mark_used()
        Token.objects.filter(user=reset_code.user).delete()

    return Response(
        {'message': 'Contrasena actualizada. Ya puedes iniciar sesion.'},
        status=status.HTTP_200_OK,
    )


@csrf_exempt
@api_view(['PATCH'])
@authentication_classes([ExpiringTokenAuthentication])
@permission_classes([IsAuthenticated])
@parser_classes([JSONParser, FormParser, MultiPartParser])
def update_user_profile(request):
    user = request.user

    user.username = request.data.get('username', user.username)
    user.first_name = request.data.get('first_name', user.first_name)
    user.last_name = request.data.get('last_name', user.last_name)
    user.email = request.data.get('email', user.email)

    if has_backoffice_access(request.user):
        user.account_balance = request.data.get(
            'account_balance',
            user.account_balance,
        )

    if 'profile_image' in request.FILES:
        user.profile_image = request.FILES['profile_image']

    password = request.data.get('password', None)
    if password and password != '******':
        try:
            validate_password(password, user)
        except DjangoValidationError as exc:
            return Response(
                {'password': list(exc.messages)},
                status=status.HTTP_400_BAD_REQUEST,
            )
        user.set_password(password)

    user.save()

    return Response(
        UserSerializer(instance=user, context={'request': request}).data,
        status=status.HTTP_200_OK,
    )


@api_view(['DELETE'])
@authentication_classes([ExpiringTokenAuthentication])
@permission_classes([IsAuthenticated])
def delete_user(request):
    user = request.user

    try:
        deactivate_user_account(user)
        return Response(
            {'detail': 'Cuenta eliminada correctamente.'},
            status=status.HTTP_204_NO_CONTENT,
        )
    except Exception as exc:
        logger.exception('Unable to deactivate user account.')
        return Response({'error': str(exc)}, status=status.HTTP_400_BAD_REQUEST)


@api_view(['POST'])
@authentication_classes([ExpiringTokenAuthentication])
@permission_classes([IsAuthenticated])
def user_profile(request):
    serializer = UserSerializer(instance=request.user, context={'request': request})
    return Response(serializer.data, status=status.HTTP_200_OK)


@api_view(['POST'])
@authentication_classes([ExpiringTokenAuthentication])
@permission_classes([IsAuthenticated])
def refresh_token(request):
    return Response(
        {
            'message': 'Sesion vigente.',
            'session': {
                'idle_timeout_seconds': get_session_idle_timeout_seconds(),
            },
        },
        status=status.HTTP_200_OK,
    )


@api_view(['POST'])
@authentication_classes([ExpiringTokenAuthentication])
@permission_classes([IsAuthenticated])
def logout(request):
    try:
        token = Token.objects.get(user=request.user)
        token.delete()
        return Response({'message': 'Logout successful.'}, status=status.HTTP_200_OK)
    except Token.DoesNotExist:
        return Response(
            {'error': 'Token not found.'},
            status=status.HTTP_400_BAD_REQUEST,
        )
