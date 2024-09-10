from django.urls import path
from . import views

urlpatterns = [
    path('attractions/', views.getAttractions),
    path('attractions/add/', views.addAttraction),
    path('foods/', views.getFoods),
    path('foods/add/', views.addFood),
]
