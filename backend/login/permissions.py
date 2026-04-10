from rest_framework.permissions import BasePermission, SAFE_METHODS


def has_backoffice_access(user):
    return bool(
        user
        and user.is_authenticated
        and getattr(user, 'is_admin_user', False)
    )


class IsAdminUserReal(BasePermission):
    message = "You do not have permission to access this resource."

    def has_permission(self, request, view):
        return has_backoffice_access(request.user)


class ReadOnlyOrAdminUser(BasePermission):
    message = "You do not have permission to modify this resource."

    def has_permission(self, request, view):
        if request.method in SAFE_METHODS:
            return True

        return has_backoffice_access(request.user)
