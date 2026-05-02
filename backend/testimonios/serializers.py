from rest_framework import serializers

from .models import Testimonial


class TestimonialSerializer(serializers.ModelSerializer):
    visible_name = serializers.CharField(read_only=True)
    profile_image_url = serializers.SerializerMethodField()

    class Meta:
        model = Testimonial
        fields = [
            'id',
            'visible_name',
            'comment',
            'rating',
            'profile_image_url',
            'status',
            'moderation_note',
            'created_at',
            'updated_at',
        ]
        read_only_fields = [
            'id',
            'visible_name',
            'profile_image_url',
            'created_at',
            'updated_at',
        ]

    def get_profile_image_url(self, obj):
        request = self.context.get('request')
        if not obj.user.profile_image:
            return None
        if request is None:
            return obj.user.profile_image.url
        return request.build_absolute_uri(obj.user.profile_image.url)

    def validate_rating(self, value):
        if value is None:
            return value
        if value < 1 or value > 5:
            raise serializers.ValidationError('La valoracion debe estar entre 1 y 5.')
        return value

    def validate_comment(self, value):
        normalized = value.strip()
        if len(normalized) < 10:
            raise serializers.ValidationError(
                'El comentario debe tener al menos 10 caracteres.'
            )
        return normalized

    def create(self, validated_data):
        validated_data['user'] = self.context['request'].user
        validated_data['status'] = Testimonial.STATUS_PENDING
        return super().create(validated_data)

    def update(self, instance, validated_data):
        request = self.context.get('request')
        user = getattr(request, 'user', None)

        if not getattr(user, 'is_admin_user', False):
            validated_data.pop('status', None)
            validated_data.pop('moderation_note', None)

        return super().update(instance, validated_data)
