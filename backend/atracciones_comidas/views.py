from decimal import Decimal

from django.db import transaction
from rest_framework import permissions, status, viewsets
from rest_framework.decorators import action
from rest_framework.exceptions import NotFound, ValidationError
from rest_framework.response import Response

from compra_brazaletes.models import Bracelet
from compra_brazaletes.serializers import BraceletSerializer
from login.permissions import ReadOnlyOrAdminUser

from .models import Attractions, Food
from .serializers import AttractionsSerializer, FoodSerializer


PAYMENT_SOURCE_BRACELET = 'BRACELET_BALANCE'
PAYMENT_SOURCE_ACCOUNT = 'ACCOUNT_BALANCE'
VALID_PAYMENT_SOURCES = {PAYMENT_SOURCE_BRACELET, PAYMENT_SOURCE_ACCOUNT}


def get_owned_bracelet(user, bracelet_id):
    if not bracelet_id:
        raise ValidationError({'bracelet_id': 'bracelet_id is required.'})

    bracelet = (
        Bracelet.objects.filter(
            id=bracelet_id,
            purchase_receipts__user=user,
        )
        .distinct()
        .first()
    )

    if bracelet is None:
        raise NotFound('Bracelet not found for the current user.')

    return bracelet


class AttractionViewSet(viewsets.ModelViewSet):
    queryset = Attractions.objects.all().order_by('name')
    serializer_class = AttractionsSerializer
    permission_classes = [ReadOnlyOrAdminUser]

    @action(
        detail=True,
        methods=['post'],
        permission_classes=[permissions.IsAuthenticated],
    )
    def consume(self, request, pk=None):
        attraction = self.get_object()
        bracelet = get_owned_bracelet(request.user, request.data.get('bracelet_id'))
        required_uses = attraction.usage_points

        if bracelet.attraction_uses_remaining < required_uses:
            return Response(
                {
                    'detail': 'El brazalete no tiene usos suficientes para esta atraccion.',
                    'required_uses': required_uses,
                    'remaining_uses': bracelet.attraction_uses_remaining,
                    'attraction': self.get_serializer(attraction).data,
                    'bracelet': BraceletSerializer(
                        bracelet,
                        context={'request': request},
                    ).data,
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        with transaction.atomic():
            bracelet.attraction_uses_remaining -= required_uses
            bracelet.save(update_fields=['attraction_uses_remaining'])

        return Response(
            {
                'detail': 'Atraccion utilizada correctamente.',
                'required_uses': required_uses,
                'remaining_uses': bracelet.attraction_uses_remaining,
                'attraction': self.get_serializer(attraction).data,
                'bracelet': BraceletSerializer(
                    bracelet,
                    context={'request': request},
                ).data,
            },
            status=status.HTTP_200_OK,
        )


class FoodViewSet(viewsets.ModelViewSet):
    queryset = Food.objects.all().order_by('name')
    serializer_class = FoodSerializer
    permission_classes = [ReadOnlyOrAdminUser]

    @action(
        detail=True,
        methods=['post'],
        permission_classes=[permissions.IsAuthenticated],
    )
    def purchase(self, request, pk=None):
        food = self.get_object()
        bracelet = get_owned_bracelet(request.user, request.data.get('bracelet_id'))
        payment_source = request.data.get('payment_source', PAYMENT_SOURCE_BRACELET)

        if payment_source not in VALID_PAYMENT_SOURCES:
            raise ValidationError(
                {
                    'payment_source': (
                        'payment_source must be BRACELET_BALANCE or ACCOUNT_BALANCE.'
                    )
                }
            )

        user = request.user
        if user.account_balance is None:
            user.account_balance = Decimal('0.00')

        food_price = food.price

        if payment_source == PAYMENT_SOURCE_BRACELET:
            if bracelet.current_balance < food_price:
                return Response(
                    {
                        'detail': 'El brazalete no tiene saldo suficiente para esta comida.',
                        'price': food_price,
                        'bracelet_balance': bracelet.current_balance,
                        'account_balance': user.account_balance,
                        'fallback_available': user.account_balance >= food_price,
                        'food': self.get_serializer(food).data,
                        'bracelet': BraceletSerializer(
                            bracelet,
                            context={'request': request},
                        ).data,
                    },
                    status=status.HTTP_400_BAD_REQUEST,
                )

            with transaction.atomic():
                bracelet.current_balance -= food_price
                bracelet.save(update_fields=['current_balance'])

            detail = 'Comida comprada con saldo del brazalete.'
        else:
            if user.account_balance < food_price:
                return Response(
                    {
                        'detail': 'La cuenta del usuario no tiene saldo suficiente para esta comida.',
                        'price': food_price,
                        'bracelet_balance': bracelet.current_balance,
                        'account_balance': user.account_balance,
                        'food': self.get_serializer(food).data,
                        'bracelet': BraceletSerializer(
                            bracelet,
                            context={'request': request},
                        ).data,
                    },
                    status=status.HTTP_400_BAD_REQUEST,
                )

            with transaction.atomic():
                user.account_balance -= food_price
                user.save(update_fields=['account_balance'])

            detail = 'Comida comprada con saldo interno de la cuenta.'

        return Response(
            {
                'detail': detail,
                'payment_source': payment_source,
                'food': self.get_serializer(food).data,
                'bracelet': BraceletSerializer(
                    bracelet,
                    context={'request': request},
                ).data,
                'account_balance': user.account_balance,
            },
            status=status.HTTP_200_OK,
        )
