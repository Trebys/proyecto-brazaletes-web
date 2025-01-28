from django.shortcuts import render, get_object_or_404
from rest_framework.response import Response
from rest_framework import viewsets, permissions
from rest_framework import status
from rest_framework.decorators import api_view, authentication_classes, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.authentication import TokenAuthentication
from rest_framework.authtoken.models import Token
from django.utils import timezone
from .models import User, ExpiringToken
from .serializers import UserSerializer
from datetime import timedelta
from django.views.decorators.csrf import csrf_exempt
from rest_framework.exceptions import AuthenticationFailed


class UserViewSet(viewsets.ModelViewSet):
    queryset = User.objects.all()
    permission_classes = [
        permissions.AllowAny
    ]
    serializer_class = UserSerializer


# Mis Endpoints

# Iniciar sesión y brinda datos del usuario
from rest_framework.authtoken.models import Token
from django.utils import timezone
from datetime import timedelta

# Mis Endpoints

# Iniciar sesión y cerrar sesiones anteriores si hay
@api_view(['POST'])
def login(request):
    identifier = request.data.get('identifier')
    password = request.data.get('password')

    if not identifier or not password:
        return Response({'message': 'Username/Email and password are required.'}, status=status.HTTP_400_BAD_REQUEST)

    # Buscar usuario por nombre de usuario o email
    user = User.objects.filter(username=identifier).first() or User.objects.filter(email=identifier).first()

    if not user:
        return Response({'message': 'User not found or does not exist.'}, status=status.HTTP_404_NOT_FOUND)

    if not user.check_password(password):
        return Response({'message': 'Wrong password.'}, status=status.HTTP_400_BAD_REQUEST)

    # Eliminar cualquier token anterior del usuario para cerrar sesiones anteriores
    Token.objects.filter(user=user).delete()

    # Crear un nuevo token para la nueva sesión
    token = Token.objects.create(user=user)
    
    # Duración del token, por ejemplo, 30 minutos
    token.created = timezone.now()  # Establecemos la fecha actual como fecha de creación
    token.save()  # Guardar el token

    serializer = UserSerializer(instance=user)

    return Response({
        'Token': token.key,
        'User': serializer.data,
        'message': 'Login successful.'
    }, status=status.HTTP_200_OK)


# Registrar un nuevo cliente
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
            account_balance=validated_data['account_balance']
        )

        user.set_password(validated_data['password'])
        user.save()

        token = ExpiringToken.objects.create(user=user)

        return Response({'Token': token.key, "User": serializer.data}, status=status.HTTP_201_CREATED)
    
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

# Actualizar el perfil del usuario
@csrf_exempt
@api_view(['PATCH'])
@authentication_classes([TokenAuthentication])
@permission_classes([IsAuthenticated])
def update_user_profile(request):
    
    user = request.user  # Obtenemos el usuario autenticado

    # Actualizar los campos del usuario
    user.username = request.data.get('username', user.username)
    user.first_name = request.data.get('first_name', user.first_name)
    user.last_name = request.data.get('last_name', user.last_name)
    user.email = request.data.get('email', user.email)
    user.account_balance = request.data.get('account_balance', user.account_balance)  # Asumiendo que tienes un perfil relacionado

    # Verificar si se está actualizando la contraseña
    password = request.data.get('password', None)
    if password and password != "******":  # Asegurarse de no cambiar si solo es un campo visual
        user.set_password(password)  # Este método se asegura de encriptar la contraseña correctamente

    user.save()  # Guardar los cambios en la base de datos

    return Response({
        'username': user.username,
        'first_name': user.first_name,
        'last_name': user.last_name,
        'email': user.email,
        'account_balance': user.account_balance,  # Asumiendo que tienes un perfil relacionado
    })

# Eliminar el usuario autenticado
@api_view(['DELETE'])
@authentication_classes([TokenAuthentication])
@permission_classes([IsAuthenticated])
def delete_user(request):
    user = request.user  # Obtenemos el usuario autenticado
    
    try:
        user.delete()  # Eliminamos al usuario de la base de datos
        return Response({"detail": "User deleted successfully."}, status=status.HTTP_204_NO_CONTENT)
    except Exception as e:
        return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)



# Brinda la información del usuario autenticado
@api_view(['POST'])
@authentication_classes([TokenAuthentication])
@permission_classes([IsAuthenticated])
def user_profile(request):
    serializer = UserSerializer(instance=request.user)
    return Response(serializer.data, status=status.HTTP_200_OK)



@api_view(['POST'])
@authentication_classes([TokenAuthentication])
@permission_classes([IsAuthenticated])
def refresh_token(request):
    token = Token.objects.get(user=request.user)
    
    # Establecer una duración de expiración del token, por ejemplo, 30 minutos
    expiration_time = token.created + timedelta(minutes=1)
    
    # Si el token ha expirado, devuelve un error personalizado
    if timezone.now() > expiration_time:
        token.delete()
        raise AuthenticationFailed('Session expired due to inactivity. Please login again.')
    
    return Response({'message': 'Token is still valid'}, status=200)


@api_view(['POST'])
@authentication_classes([TokenAuthentication])
@permission_classes([IsAuthenticated])
def logout(request):
    try:
        # Eliminar el token del backend
        token = Token.objects.get(user=request.user)
        token.delete()
        return Response({"message": "Logout successful."}, status=status.HTTP_200_OK)
    except Token.DoesNotExist:
        return Response({"error": "Token not found."}, status=status.HTTP_400_BAD_REQUEST)
