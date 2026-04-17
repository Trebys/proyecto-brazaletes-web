from rest_framework import serializers
from .models import Attractions, Food


class AttractionsSerializer(serializers.ModelSerializer):
    photo_url = serializers.SerializerMethodField()

    class Meta:
        model = Attractions
        fields = ['id', 'name', 'description', 'photo', 'photo_url', 'usage_points']

    def get_photo_url(self, obj):
        request = self.context.get('request')
        if not obj.photo:
            return None
        if request is None:
            return obj.photo.url
        return request.build_absolute_uri(obj.photo.url)


class FoodSerializer(serializers.ModelSerializer):
    photo_url = serializers.SerializerMethodField()

    class Meta:
        model = Food
        fields = ['id', 'name', 'description', 'photo', 'photo_url', 'price']

    def get_photo_url(self, obj):
        request = self.context.get('request')
        if not obj.photo:
            return None
        if request is None:
            return obj.photo.url
        return request.build_absolute_uri(obj.photo.url)
