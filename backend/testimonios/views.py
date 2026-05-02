from rest_framework import permissions, viewsets
from rest_framework.parsers import FormParser, JSONParser, MultiPartParser

from login.permissions import has_backoffice_access

from .models import Testimonial
from .serializers import TestimonialSerializer


class TestimonialPermission(permissions.BasePermission):
    def has_permission(self, request, view):
        if request.method in permissions.SAFE_METHODS:
            return True
        if request.method == 'POST':
            return bool(request.user and request.user.is_authenticated)
        return has_backoffice_access(request.user)

    def has_object_permission(self, request, view, obj):
        if request.method in permissions.SAFE_METHODS:
            return obj.status == Testimonial.STATUS_PUBLISHED or has_backoffice_access(
                request.user
            )
        return has_backoffice_access(request.user)


class TestimonialViewSet(viewsets.ModelViewSet):
    serializer_class = TestimonialSerializer
    permission_classes = [TestimonialPermission]
    parser_classes = [JSONParser, FormParser, MultiPartParser]

    def get_queryset(self):
        queryset = Testimonial.objects.select_related('user')
        if has_backoffice_access(self.request.user):
            if self.request.query_params.get('published_only') == '1':
                return queryset.filter(status=Testimonial.STATUS_PUBLISHED)
            return queryset
        return queryset.filter(status=Testimonial.STATUS_PUBLISHED)
