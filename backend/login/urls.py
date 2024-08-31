from rest_framework import routers
from django.urls import path
from .views import UserViewSet


# Crea una instancia de DefaultRouter
router = routers.DefaultRouter()

# Registra los ViewSets con la instancia de DefaultRouter
router.register('Users', UserViewSet, basename='Usuarios')

# Añade rutas manuales (como la de login)
urlpatterns = router.urls + [
    #path('login/', LoginView.as_view(), name='login'),
    #path('perfil-cliente/', Datos_perfil_cliente.as_view(), name='perfil-cliente'),
]
