from django.contrib import admin

from .models import Testimonial


@admin.register(Testimonial)
class TestimonialAdmin(admin.ModelAdmin):
    list_display = ('visible_name', 'rating', 'status', 'created_at')
    list_filter = ('status', 'rating', 'created_at')
    search_fields = (
        'comment',
        'user__username',
        'user__first_name',
        'user__last_name',
        'user__email',
    )
    readonly_fields = ('created_at', 'updated_at')
