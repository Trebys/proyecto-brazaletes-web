from rest_framework import routers
from django.urls import path, re_path
from .views import UserViewSet,login,register_client,user_profile,refresh_token


# Crea una instancia de DefaultRouter
router = routers.DefaultRouter()

# Registra los ViewSets con la instancia de DefaultRouter
router.register('Users', UserViewSet, basename='Usuarios')

# Añade rutas manuales (como la de login)
urlpatterns = router.urls + [
    re_path('login', login),
    re_path('register', register_client),
    re_path('user-profile', user_profile),
    re_path('refresh-token', refresh_token)
]
