from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError as DjangoValidationError
from rest_framework import serializers
from .models import User


class UserSerializer(serializers.ModelSerializer):
    is_admin = serializers.SerializerMethodField(read_only=True)
    profile_image_url = serializers.SerializerMethodField(read_only=True)

    class Meta:
        model = User
        fields = [
            'id',
            'username',
            'first_name',
            'last_name',
            'email',
            'password',
            'account_balance',
            'profile_image',
            'profile_image_url',
            'is_staff',
            'is_superuser',
            'is_admin',
            'is_active',
        ]
        extra_kwargs = {
            'password': {'write_only': True},
            'username': {'required': True, 'allow_blank': False},
            'first_name': {'required': True, 'allow_blank': False},
            'last_name': {'required': True, 'allow_blank': False},
            'email': {'required': True, 'allow_blank': False},
            'account_balance': {'required': False},
            'is_staff': {'read_only': True},
            'is_superuser': {'read_only': True},
            'is_active': {'read_only': True},
        }

    def validate_email(self, value):
        email = value.strip().lower()
        queryset = User.objects.filter(email__iexact=email)

        if self.instance:
            queryset = queryset.exclude(pk=self.instance.pk)

        if queryset.exists():
            raise serializers.ValidationError('Este correo ya esta registrado.')

        return email

    def validate_username(self, value):
        username = value.strip()
        queryset = User.objects.filter(username__iexact=username)

        if self.instance:
            queryset = queryset.exclude(pk=self.instance.pk)

        if queryset.exists():
            raise serializers.ValidationError('Este nombre de usuario ya existe.')

        return username

    def validate_password(self, value):
        try:
            validate_password(value, self.instance)
        except DjangoValidationError as exc:
            raise serializers.ValidationError(list(exc.messages))

        return value

    def validate_account_balance(self, value):
        return value if value is not None else 0

    def get_is_admin(self, obj):
        return obj.is_admin_user

    def get_profile_image_url(self, obj):
        request = self.context.get('request')
        if not obj.profile_image:
            return None
        if request is None:
            return obj.profile_image.url
        return request.build_absolute_uri(obj.profile_image.url)


class PasswordResetRequestSerializer(serializers.Serializer):
    username = serializers.CharField()
    email = serializers.EmailField()

    def validate_username(self, value):
        return value.strip()

    def validate_email(self, value):
        return value.strip().lower()


class PasswordResetConfirmSerializer(serializers.Serializer):
    username = serializers.CharField()
    email = serializers.EmailField()
    code = serializers.CharField(min_length=6, max_length=6)
    new_password = serializers.CharField(write_only=True)

    def validate_username(self, value):
        return value.strip()

    def validate_email(self, value):
        return value.strip().lower()

    def validate_code(self, value):
        if not value.isdigit():
            raise serializers.ValidationError('El codigo debe tener 6 digitos.')
        return value

    def validate_new_password(self, value):
        try:
            validate_password(value)
        except DjangoValidationError as exc:
            raise serializers.ValidationError(list(exc.messages))

        return value

