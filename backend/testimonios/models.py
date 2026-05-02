from django.conf import settings
from django.db import models


def testimonial_image_path(instance, filename):
    return f'testimonials/user_{instance.user_id}/{filename}'


class Testimonial(models.Model):
    STATUS_PENDING = 'PENDING'
    STATUS_PUBLISHED = 'PUBLISHED'
    STATUS_REJECTED = 'REJECTED'

    STATUS_CHOICES = [
        (STATUS_PENDING, 'Pendiente'),
        (STATUS_PUBLISHED, 'Publicado'),
        (STATUS_REJECTED, 'Rechazado'),
    ]

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='testimonials',
    )
    comment = models.TextField(max_length=800)
    rating = models.PositiveSmallIntegerField(null=True, blank=True)
    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default=STATUS_PENDING,
    )
    moderation_note = models.CharField(max_length=255, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f'{self.visible_name} - {self.get_status_display()}'

    @property
    def visible_name(self):
        full_name = self.user.get_full_name().strip()
        return full_name or self.user.username
