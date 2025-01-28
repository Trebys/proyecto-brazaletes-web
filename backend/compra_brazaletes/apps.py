from django.apps import AppConfig


class CompraBrazaletesConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'compra_brazaletes'

    def ready(self):

        import compra_brazaletes.signals  # <--- Importa tus signals
