# serializers.py
from rest_framework import serializers
from .models import BraceletType, Bracelet, BraceletTransaction, PurchaseReceipt
from django.contrib.auth import get_user_model

User = get_user_model()


class UserBasicSerializer(serializers.ModelSerializer):
    """ Serializador para exponer datos básicos del usuario. """
    class Meta:
        model = User
        fields = ['id', 'username', 'first_name', 'last_name']


class BraceletTypeSerializer(serializers.ModelSerializer):
    image_url = serializers.SerializerMethodField()

    class Meta:
        model = BraceletType
        fields = [
            'id',
            'name',
            'price',
            'attraction_uses',
            'food_balance',
            'description',
            'image',
            'image_url',
            'is_active',
        ]

    def get_image_url(self, obj):
        if not obj.image:
            return ''

        request = self.context.get('request')
        if request:
            return request.build_absolute_uri(obj.image.url)

        return obj.image.url


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


class BraceletTransactionSerializer(serializers.ModelSerializer):
    bracelet = BraceletSerializer(read_only=True)
    owner = UserBasicSerializer(read_only=True)
    performed_by = UserBasicSerializer(read_only=True)
    attraction_name = serializers.CharField(source='attraction.name', read_only=True)
    food_name = serializers.CharField(source='food.name', read_only=True)

    class Meta:
        model = BraceletTransaction
        fields = [
            'id',
            'bracelet',
            'owner',
            'performed_by',
            'transaction_type',
            'concept',
            'balance_delta',
            'uses_delta',
            'balance_before',
            'balance_after',
            'uses_before',
            'uses_after',
            'attraction',
            'attraction_name',
            'food',
            'food_name',
            'occurred_at',
        ]
        read_only_fields = fields
