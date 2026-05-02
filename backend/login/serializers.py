from rest_framework import serializers
from .models import User


class UserSerializer(serializers.ModelSerializer):
    is_admin = serializers.SerializerMethodField(read_only=True)

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
            'is_staff',
            'is_superuser',
            'is_admin',
        ]
        extra_kwargs = {
            'password': {'write_only': True},
            'account_balance': {'required': False},
            'is_staff': {'read_only': True},
            'is_superuser': {'read_only': True},
        }

    def get_is_admin(self, obj):
        return obj.is_admin_user

