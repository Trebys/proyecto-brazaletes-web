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
from .permissions import IsAdminUserReal, has_backoffice_access
from .serializers import UserSerializer


class UserViewSet(viewsets.ModelViewSet):
    queryset = User.objects.all()
    permission_classes = [IsAdminUserReal]
    serializer_class = UserSerializer
    parser_classes = [JSONParser, FormParser, MultiPartParser]


def build_session_payload(replaced_existing_session=False):
    return {
        'idle_timeout_seconds': get_session_idle_timeout_seconds(),
        'replaced_existing_session': replaced_existing_session,
    }


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
    serializer = UserSerializer(data=request.data)

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
        user.delete()
        return Response(
            {'detail': 'User deleted successfully.'},
            status=status.HTTP_204_NO_CONTENT,
        )
    except Exception as exc:
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
