from decimal import Decimal

from django.db import transaction
from rest_framework import permissions, status, viewsets
from rest_framework.decorators import action
from rest_framework.exceptions import NotFound, ValidationError
from rest_framework.response import Response

from compra_brazaletes.models import Bracelet, BraceletTransaction, PurchaseReceipt
from compra_brazaletes.serializers import BraceletSerializer
from login.permissions import ReadOnlyOrAdminUser

from .models import Attractions, Food
from .serializers import AttractionsSerializer, FoodSerializer


PAYMENT_SOURCE_BRACELET = 'BRACELET_BALANCE'
VALID_PAYMENT_SOURCES = {PAYMENT_SOURCE_BRACELET}


def get_owned_bracelet(user, bracelet_id, for_update=False):
    if not bracelet_id:
        raise ValidationError({'bracelet_id': 'bracelet_id is required.'})

    if for_update:
        owns_bracelet = PurchaseReceipt.objects.filter(
            user=user,
            bracelet_id=bracelet_id,
        ).exists()

        if not owns_bracelet:
            raise NotFound('Bracelet not found for the current user.')

        try:
            return Bracelet.objects.select_for_update().get(id=bracelet_id)
        except Bracelet.DoesNotExist:
            raise NotFound('Bracelet not found for the current user.')

    queryset = Bracelet.objects

    bracelet = (
        queryset.filter(
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
        bracelet_id = request.data.get('bracelet_id')
        required_uses = attraction.usage_points

        with transaction.atomic():
            bracelet = get_owned_bracelet(request.user, bracelet_id, for_update=True)
            uses_before = bracelet.attraction_uses_remaining

            if uses_before < required_uses:
                return Response(
                    {
                        'detail': 'El brazalete no tiene usos suficientes para esta atraccion.',
                        'required_uses': required_uses,
                        'remaining_uses': uses_before,
                        'attraction': self.get_serializer(attraction).data,
                        'bracelet': BraceletSerializer(
                            bracelet,
                            context={'request': request},
                        ).data,
                    },
                    status=status.HTTP_400_BAD_REQUEST,
                )

            bracelet.attraction_uses_remaining -= required_uses
            bracelet.save(update_fields=['attraction_uses_remaining'])
            movement = BraceletTransaction.objects.create(
                bracelet=bracelet,
                owner=request.user,
                performed_by=request.user,
                attraction=attraction,
                transaction_type=BraceletTransaction.TYPE_ATTRACTION_CONSUMPTION,
                concept=f'Uso de atraccion: {attraction.name}',
                balance_delta=Decimal('0.00'),
                uses_delta=-required_uses,
                balance_before=bracelet.current_balance,
                balance_after=bracelet.current_balance,
                uses_before=uses_before,
                uses_after=bracelet.attraction_uses_remaining,
            )

        return Response(
            {
                'detail': 'Atraccion utilizada correctamente.',
                'transaction_id': movement.id,
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
        bracelet_id = request.data.get('bracelet_id')
        payment_source = request.data.get('payment_source', PAYMENT_SOURCE_BRACELET)

        if payment_source not in VALID_PAYMENT_SOURCES:
            raise ValidationError(
                {
                    'payment_source': (
                        'payment_source must be BRACELET_BALANCE.'
                    )
                }
            )

        user = request.user
        if user.account_balance is None:
            user.account_balance = Decimal('0.00')

        food_price = food.price

        if payment_source != PAYMENT_SOURCE_BRACELET:
            raise ValidationError(
                {
                    'payment_source': (
                        'Este consumo debe descontarse del saldo del brazalete.'
                    )
                }
            )

        with transaction.atomic():
            bracelet = get_owned_bracelet(request.user, bracelet_id, for_update=True)
            balance_before = bracelet.current_balance

            if balance_before < food_price:
                return Response(
                    {
                        'detail': 'El brazalete no tiene saldo suficiente para esta comida.',
                        'price': food_price,
                        'bracelet_balance': balance_before,
                        'account_balance': user.account_balance,
                        'fallback_available': False,
                        'food': self.get_serializer(food).data,
                        'bracelet': BraceletSerializer(
                            bracelet,
                            context={'request': request},
                        ).data,
                    },
                    status=status.HTTP_400_BAD_REQUEST,
                )

            bracelet.current_balance -= food_price
            bracelet.save(update_fields=['current_balance'])
            movement = BraceletTransaction.objects.create(
                bracelet=bracelet,
                owner=request.user,
                performed_by=request.user,
                food=food,
                transaction_type=BraceletTransaction.TYPE_FOOD_CONSUMPTION,
                concept=f'Compra de comida: {food.name}',
                balance_delta=-food_price,
                uses_delta=0,
                balance_before=balance_before,
                balance_after=bracelet.current_balance,
                uses_before=bracelet.attraction_uses_remaining,
                uses_after=bracelet.attraction_uses_remaining,
            )

        return Response(
            {
                'detail': 'Comida comprada con saldo del brazalete.',
                'transaction_id': movement.id,
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
