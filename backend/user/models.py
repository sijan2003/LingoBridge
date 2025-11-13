from django.db import models
from django.contrib.auth.models import AbstractUser


class CustomUser(AbstractUser):
    phone_number = models.CharField(max_length=15,)
    preferred_language = models.CharField(
            max_length=5,
            choices=(('en', 'English'), ('fr', 'French'), ('es', 'Spanish')),
            default='en'
        )
    gender = models.CharField(max_length=10, blank=True, null=True)
    address = models.CharField(max_length=100 , null=True)
    is_premium = models.BooleanField(default=False)
    joined_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
            return self.username