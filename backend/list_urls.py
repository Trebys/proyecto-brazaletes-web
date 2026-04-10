import os
import django
from django.urls import get_resolver

# OJO: ajusta este nombre si tu proyecto django se llama distinto
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "backend_django.settings")

django.setup()


def show(urlpatterns, prefix=""):
    for p in urlpatterns:
        # include()
        if hasattr(p, "url_patterns"):
            show(p.url_patterns, prefix + str(p.pattern))
        else:
            print(prefix + str(p.pattern))


show(get_resolver().url_patterns)
