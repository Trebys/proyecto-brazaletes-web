from django.db import models

# Create your models here.

class Attractions(models.Model):
    name = models.CharField(max_length=120)
    description = models.TextField()
    photo = models.ImageField(upload_to='attractions/')
    usage_points = models.PositiveIntegerField()
    
    def __str__(self):
        return self.name


class Food(models.Model):
    name = models.CharField(max_length=120)  
    description = models.TextField() 
    photo = models.ImageField(upload_to='foods/')  
    price = models.DecimalField(max_digits=10, decimal_places=2)  

    def __str__(self):
        return self.name
