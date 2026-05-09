from rest_framework import routers
from django.urls import path, re_path
from .views import (
    UserViewSet,
    confirm_password_reset,
    delete_user,
    login,
    logout,
    refresh_token,
    register_client,
    request_password_reset,
    update_user_profile,
    user_profile,
)


# Crea una instancia de DefaultRouter
router = routers.DefaultRouter()

# Registra los ViewSets con la instancia de DefaultRouter
router.register('Users', UserViewSet, basename='Usuarios')

# Añade rutas manuales (como la de login)
urlpatterns = router.urls + [
    re_path('login', login),
    re_path('register', register_client),
    re_path('password-reset/request', request_password_reset),
    re_path('password-reset/confirm', confirm_password_reset),
    re_path('user-profile', user_profile),
    re_path('refresh-token', refresh_token),
    re_path('logout', logout),
    re_path('edit-user', update_user_profile),
    re_path('delete-user', delete_user),
]
