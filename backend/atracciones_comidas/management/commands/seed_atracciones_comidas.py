from decimal import Decimal

from django.core.management.base import BaseCommand

from atracciones_comidas.models import Attractions, Food


ATTRACTIONS = [
    {
        'name': 'Montana Rusa "Dragon Volador"',
        'description': (
            'Una emocionante montana rusa que simula un vuelo en el lomo de un '
            'dragon, con giros vertiginosos y descensos que quitan el aliento. '
            'Perfecta para los amantes de la adrenalina.'
        ),
        'photo': 'attractions/montania_rusa_dragon.jpg',
        'usage_points': 1,
    },
    {
        'name': 'Carrusel Encantado',
        'description': (
            'Un clasico carrusel con animales magicos, luces brillantes y '
            'musica alegre, ideal para visitantes mas pequenos y adultos que '
            'buscan una experiencia nostalgica.'
        ),
        'photo': 'attractions/carrusel_encantado.jpg',
        'usage_points': 1,
    },
    {
        'name': 'La Torre de los Valientes',
        'description': (
            'Una torre de caida libre que desafia a los visitantes a subir a '
            'lo mas alto y experimentar la emocion de una caida repentina. '
            'Te atreves a enfrentar tus miedos?'
        ),
        'photo': 'attractions/torre_de_los_valientes.jpg',
        'usage_points': 1,
    },
]

FOODS = [
    {
        'name': 'Big Thrill Burger',
        'description': 'Hamburguesa clasica del parque con papas y salsa especial.',
        'photo': 'foods/big_thrill_burger.jpg',
        'price': Decimal('8.00'),
    },
    {
        'name': 'Pizza Aventura',
        'description': 'Pizza personal con queso derretido y pepperoni.',
        'photo': 'foods/pizza_aventura.jpg',
        'price': Decimal('10.00'),
    },
    {
        'name': 'Delirio Frio',
        'description': 'Postre frio y colorido para cerrar el recorrido.',
        'photo': 'foods/delirio_frio.jpg',
        'price': Decimal('5.00'),
    },
]


class Command(BaseCommand):
    help = 'Carga o actualiza el catalogo base de atracciones y comidas.'

    def handle(self, *args, **options):
        for attraction_data in ATTRACTIONS:
            attraction, created = Attractions.objects.update_or_create(
                name=attraction_data['name'],
                defaults={
                    'description': attraction_data['description'],
                    'photo': attraction_data['photo'],
                    'usage_points': attraction_data['usage_points'],
                },
            )
            action = 'creada' if created else 'actualizada'
            self.stdout.write(
                self.style.SUCCESS(f'Atraccion {action}: {attraction.name}')
            )

        for food_data in FOODS:
            food, created = Food.objects.update_or_create(
                name=food_data['name'],
                defaults={
                    'description': food_data['description'],
                    'photo': food_data['photo'],
                    'price': food_data['price'],
                },
            )
            action = 'creada' if created else 'actualizada'
            self.stdout.write(self.style.SUCCESS(f'Comida {action}: {food.name}'))

        self.stdout.write(self.style.SUCCESS('Catalogo base cargado correctamente.'))
