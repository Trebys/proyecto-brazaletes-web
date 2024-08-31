from django.shortcuts import render, get_object_or_404
from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import viewsets,permissions
from .models import User
from .serializers import UserSerializer
from rest_framework.authtoken.models import Token
from rest_framework import status

# Create your views here.
class UserViewSet(viewsets.ModelViewSet):
    queryset = User.objects.all()
    permission_classes = [
        permissions.AllowAny
    ]
    serializer_class = UserSerializer


#Mis Endpoints
@api_view(['POST'])
def login(request):
    # Obtener el valor del identificador (puede ser username o email) y la contraseña
    identifier = request.data.get('identifier')
    password = request.data.get('password')

    # Validar que ambos campos están presentes
    if not identifier or not password:
        return Response({'mensaje': 'Username/Email y contraseña son requeridos.'}, status=status.HTTP_400_BAD_REQUEST)

    # Intentar buscar al usuario ya sea por username o por email
    user = User.objects.filter(username=identifier).first() or User.objects.filter(email=identifier).first()

    # Validar si el usuario existe
    if not user:
        return Response({'mensaje': 'Usuario no encontrado.'}, status=status.HTTP_404_NOT_FOUND)

    # Verificar la contraseña
    if not user.check_password(password):
        return Response({'mensaje': 'Contraseña incorrecta'}, status=status.HTTP_400_BAD_REQUEST)

    # Obtener o crear el token de autenticación
    token, created = Token.objects.get_or_create(user=user)
    serializer = UserSerializer(instance=user)

    return Response({'Token': token.key, "user": serializer.data}, status=status.HTTP_200_OK)


        

   

@api_view(['POST'])
def register_client(request):
    # Crear una instancia del serializador con los datos proporcionados
    serializer = UserSerializer(data=request.data)
    
    # Verificar si los datos proporcionados son válidos
    if serializer.is_valid():
        # Extraer los datos validados del serializador
        validated_data = serializer.validated_data

        # Crear una nueva instancia de usuario sin guardar en la base de datos
        user = User(
            username=validated_data['username'],
            email=validated_data['email'],
            first_name=validated_data['first_name'],
            last_name=validated_data['last_name'],
            account_balance=validated_data['account_balance']
        )

        # Establecer la contraseña utilizando el método de cifrado set_password
        user.set_password(validated_data['password'])

        # Guardar la instancia del usuario con la contraseña cifrada
        user.save()

        # Crear el token para el usuario recién creado
        token = Token.objects.create(user=user)

        # Retornar una respuesta con el token y los datos del usuario
        return Response({'Token': token.key, "user": serializer.data}, status=status.HTTP_201_CREATED)
    
    # Si el serializador no es válido, retornar los errores
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)




@api_view(['POST'])
def user_profile(request):
    return Response({'mensaje':'user_profile'})
