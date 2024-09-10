from rest_framework import serializers
from .models import Attractions, Food

class AttractionsSerializer(serializers.ModelSerializer):
    class Meta:
        model = Attractions
        fields = "__all__"


class FoodSerializer(serializers.ModelSerializer):
    class Meta:
        model = Food
        fields = "__all__"