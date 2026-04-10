from django.apps import apps
import os
import django

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "backend_django.settings")
django.setup()


def format_field(f):
    # Algunos campos no tienen related_model, por eso el try
    try:
        rel = f.related_model.__name__ if getattr(
            f, "is_relation", False) and f.related_model else ""
    except Exception:
        rel = ""
    extra = f" -> {rel}" if rel else ""
    return f"- {f.name}: {f.__class__.__name__}{extra}"


# Listar apps y sus modelos
for app_config in apps.get_app_configs():
    # Filtrar apps internas de Django para que no ensucie la salida
    if app_config.name.startswith("django."):
        continue
    if app_config.name.startswith("rest_framework"):
        continue

    models = list(app_config.get_models())
    if not models:
        continue

    print(f"\n=== APP: {app_config.name} ===")
    for m in models:
        print(f"\nModel: {m.__name__}  (db_table={m._meta.db_table})")
        for f in m._meta.fields:
            print(format_field(f))
        # Muchos a muchos
        for f in m._meta.many_to_many:
            print(f"- {f.name}: ManyToManyField -> {f.related_model.__name__}")
