from django.contrib.auth import get_user_model
from django.db import models
from firebase_admin.auth import get_user

user = get_user_model()

class SocialAuthUser(models.Model):
    user = models.OneToOneField(user, on_delete=models.CASCADE ,  null=True,  # allow null temporarily
        blank=True, )
    provider = models.CharField(max_length=255)
    is_verified = models.BooleanField(default=True)


    def __str__(self):
        return self.email
