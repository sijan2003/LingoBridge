from django.contrib import admin

from .models import SocialAuthUser

# Register your models here.
admin.site.register(
    [
        SocialAuthUser,
    ]
)