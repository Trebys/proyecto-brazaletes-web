from decimal import Decimal

from django.core.management.base import BaseCommand

from atracciones_comidas.models import Attractions, Food
from compra_brazaletes.models import BraceletType


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

BRACELET_TYPES = [
    {
        'name': 'Estándar',
        'price': Decimal('25.00'),
        'attraction_uses': 5,
        'food_balance': Decimal('10.00'),
        'description': (
            'Acceso inicial para disfrutar atracciones y alimentos durante '
            'una visita breve al parque.'
        ),
        'image': 'bracelets/brazalete_estandar.jpg',
    },
    {
        'name': 'Especial',
        'price': Decimal('40.00'),
        'attraction_uses': 8,
        'food_balance': Decimal('20.00'),
        'description': (
            'Una opcion equilibrada para recorrer mas atracciones y contar '
            'con mayor saldo para alimentos.'
        ),
        'image': 'bracelets/brazalete_especial.jpg',
    },
    {
        'name': 'Premium',
        'price': Decimal('60.00'),
        'attraction_uses': 12,
        'food_balance': Decimal('35.00'),
        'description': (
            'La experiencia mas completa para aprovechar una jornada amplia '
            'con mas atracciones y saldo disponible.'
        ),
        'image': 'bracelets/brazalete_premium.jpg',
    },
]


class Command(BaseCommand):
    help = 'Carga o actualiza el catalogo base de atracciones y comidas.'

    def add_arguments(self, parser):
        parser.add_argument(
            '--preserve-images',
            action='store_true',
            help=(
                'Conserva las imagenes existentes y no asigna rutas locales. '
                'Usar al cargar datos en produccion con Cloudinary.'
            ),
        )

    def handle(self, *args, **options):
        preserve_images = options['preserve_images']

        for attraction_data in ATTRACTIONS:
            defaults = {
                'description': attraction_data['description'],
                'usage_points': attraction_data['usage_points'],
            }
            if not preserve_images:
                defaults['photo'] = attraction_data['photo']

            attraction, created = Attractions.objects.update_or_create(
                name=attraction_data['name'],
                defaults=defaults,
            )
            action = 'creada' if created else 'actualizada'
            self.stdout.write(
                self.style.SUCCESS(f'Atraccion {action}: {attraction.name}')
            )

        for food_data in FOODS:
            defaults = {
                'description': food_data['description'],
                'price': food_data['price'],
            }
            if not preserve_images:
                defaults['photo'] = food_data['photo']

            food, created = Food.objects.update_or_create(
                name=food_data['name'],
                defaults=defaults,
            )
            action = 'creada' if created else 'actualizada'
            self.stdout.write(self.style.SUCCESS(f'Comida {action}: {food.name}'))

        for bracelet_type_data in BRACELET_TYPES:
            defaults = {
                'price': bracelet_type_data['price'],
                'attraction_uses': bracelet_type_data['attraction_uses'],
                'food_balance': bracelet_type_data['food_balance'],
                'description': bracelet_type_data['description'],
                'is_active': True,
            }
            if not preserve_images:
                defaults['image'] = bracelet_type_data['image']

            bracelet_type, created = BraceletType.objects.update_or_create(
                name=bracelet_type_data['name'],
                defaults=defaults,
            )
            action = 'creado' if created else 'actualizado'
            self.stdout.write(
                self.style.SUCCESS(
                    f'Tipo de brazalete {action}: {bracelet_type.name}'
                )
            )

        self.stdout.write(self.style.SUCCESS('Catalogo base cargado correctamente.'))
