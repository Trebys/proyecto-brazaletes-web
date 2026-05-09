from django.core.exceptions import ValidationError
from django.utils.translation import gettext as _


class StrongPasswordValidator:
    def validate(self, password, user=None):
        checks = [
            (any(char.islower() for char in password), _('Debe incluir una minuscula.')),
            (any(char.isupper() for char in password), _('Debe incluir una mayuscula.')),
            (any(char.isdigit() for char in password), _('Debe incluir un numero.')),
            (
                any(not char.isalnum() for char in password),
                _('Debe incluir un caracter especial.'),
            ),
        ]
        errors = [message for passed, message in checks if not passed]

        if errors:
            raise ValidationError(errors)

    def get_help_text(self):
        return _(
            'Tu contrasena debe incluir minusculas, mayusculas, numeros y '
            'caracteres especiales.'
        )
