from django.shortcuts import render, get_object_or_404
from rest_framework.response import Response
from rest_framework import viewsets, permissions
from .models import User, ExpiringToken
from .serializers import UserSerializer
from rest_framework import status
from rest_framework.decorators import api_view, authentication_classes, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.authentication import TokenAuthentication
from django.utils import timezone
from rest_framework.authtoken.models import Token
from datetime import timedelta
class UserViewSet(viewsets.ModelViewSet):
    queryset = User.objects.all()
    permission_classes = [
        permissions.AllowAny
    ]
    serializer_class = UserSerializer


# Mis Endpoints
@api_view(['POST'])
def login(request):
    identifier = request.data.get('identifier')
    password = request.data.get('password')

    if not identifier or not password:
        return Response({'message': 'Username/Email and password are required.'}, status=status.HTTP_400_BAD_REQUEST)

    user = User.objects.filter(username=identifier).first() or User.objects.filter(email=identifier).first()

    if not user:
        return Response({'message': 'User not found or does not exist.'}, status=status.HTTP_404_NOT_FOUND)

    if not user.check_password(password):
        return Response({'message': 'Wrong password.'}, status=status.HTTP_400_BAD_REQUEST)

    # Obtener o crear el token de autenticación con expiración
    token, created = ExpiringToken.objects.get_or_create(user=user)

    if token.is_expired:
        # Si el token ha expirado, renovarlo
        token = token.refresh_token()

    serializer = UserSerializer(instance=user)

    return Response({'Token': token.key, "User": serializer.data}, status=status.HTTP_200_OK)


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
    
    # Establecer una duración de expiración del token, por ejemplo, 10 minutos
    expiration_time = token.created + timedelta(minutes=10)
    
    # Si el token ha expirado, se genera uno nuevo
    if timezone.now() > expiration_time:
        token.delete()
        new_token = Token.objects.create(user=request.user)
        return Response({'Token': new_token.key}, status=200)
    
    return Response({'message': 'Token is still valid'}, status=200)
