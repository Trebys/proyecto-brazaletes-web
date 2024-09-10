from django.shortcuts import render
from rest_framework.response import Response
from rest_framework.decorators import api_view
from .models import Attractions, Food
from .serializers import AttractionsSerializer, FoodSerializer

# Create your views here.

#Apis for Attractions
@api_view(['GET'])
def getAttractions(request):
    attractions = Attractions.objects.all()
    serializer = AttractionsSerializer(attractions, many=True)
    return Response(serializer.data)

@api_view(['POST'])
def addAttraction(request):
    serializer = AttractionsSerializer(data=request.data)
    if serializer.is_valid():
        serializer.save()
    return Response(serializer.data)



#Apis for Foods
@api_view(['GET'])
def getFoods(request):
    foods = Food.objects.all()
    serializer = AttractionsSerializer(foods, many=True)
    return Response(serializer.data)


@api_view(['POST'])
def addFood(request):
    serializer = FoodSerializer(data=request.data)
    if serializer.is_valid():
        serializer.save()
    return Response(serializer.data)