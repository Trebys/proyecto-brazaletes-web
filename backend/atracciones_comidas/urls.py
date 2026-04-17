from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import AttractionViewSet, FoodViewSet

router = DefaultRouter()
router.register(r'attractions', AttractionViewSet, basename='attraction')
router.register(r'foods', FoodViewSet, basename='food')

urlpatterns = [
    path('', include(router.urls)),
]
