from django.contrib import admin

from .models import Attractions, Food


@admin.register(Attractions)
class AttractionsAdmin(admin.ModelAdmin):
    list_display = ('name', 'usage_points')
    search_fields = ('name', 'description')


@admin.register(Food)
class FoodAdmin(admin.ModelAdmin):
    list_display = ('name', 'price')
    search_fields = ('name', 'description')
