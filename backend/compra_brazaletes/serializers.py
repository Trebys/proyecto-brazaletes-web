# serializers.py
from rest_framework import serializers
from .models import BraceletType, Bracelet, PurchaseReceipt
from django.contrib.auth import get_user_model

User = get_user_model()


class UserBasicSerializer(serializers.ModelSerializer):
    """ Serializador para exponer datos básicos del usuario. """
    class Meta:
        model = User
        fields = ['id', 'username', 'first_name', 'last_name']


class BraceletTypeSerializer(serializers.ModelSerializer):
    class Meta:
        model = BraceletType
        fields = '__all__'


class BraceletSerializer(serializers.ModelSerializer):
    bracelet_type = BraceletTypeSerializer(read_only=True)
    bracelet_type_id = serializers.PrimaryKeyRelatedField(
        queryset=BraceletType.objects.all(),
        source='bracelet_type',
        write_only=True
    )

    class Meta:
        model = Bracelet
        fields = [
            'id',
            'bracelet_type',
            'bracelet_type_id',
            'bracelet_code',
            'current_balance',
            'attraction_uses_remaining'
        ]


class PurchaseReceiptSerializer(serializers.ModelSerializer):
    bracelet = BraceletSerializer(read_only=True)
    user = UserBasicSerializer(read_only=True)

    class Meta:
        model = PurchaseReceipt
        # Agrega los nuevos campos
        fields = [
            'id',
            'user',
            'bracelet',
            'purchase_date',
            'purchase_code',
            'payment_method',
            'paypal_order_id',
            'amount_paid',
            'status',
        ]
        # Marcar como solo lectura si deseas que no se seteen vía PUT/POST
        read_only_fields = [
            'user',
            'bracelet',
            'purchase_date',
            'purchase_code',
            'payment_method',
            'paypal_order_id',
            'amount_paid',
        ]
