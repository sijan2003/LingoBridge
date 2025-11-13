from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import CustomUser

@admin.register(CustomUser)
class CustomUserAdmin(UserAdmin):
     list_display = ("username", "email", "phone_number", "preferred_language", "gender", "is_premium", "is_staff", "is_active")
     list_filter = ("is_staff", "is_active", "is_premium", "gender", "preferred_language")
     readonly_fields = ("joined_at",)

   # Fields for editing a user
     fieldsets = UserAdmin.fieldsets + (
         (None, {"fields": ("phone_number", "preferred_language", "gender", "address", "is_premium")}),
     )

     # Fields for creating a user
     add_fieldsets = UserAdmin.add_fieldsets + (
         (None, {"fields": ("phone_number", "preferred_language", "gender", "address", "is_premium")}),
     )

     search_fields = ("username", "email", "phone_number")
     ordering = ("-joined_at",)

