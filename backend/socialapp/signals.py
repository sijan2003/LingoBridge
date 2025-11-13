# apps/social_app/signals.py
from allauth.socialaccount.signals import social_account_added, social_account_updated
from django.dispatch import receiver
from django.conf import settings

User = settings.AUTH_USER_MODEL

@receiver(social_account_added)
@receiver(social_account_updated)
def save_social_extra_fields(request, sociallogin, **kwargs):
    user = sociallogin.user
    extra_data = sociallogin.account.extra_data

    # Profile image
    if extra_data.get("picture"):
        user.profile_image = extra_data.get("picture", user.profile_image)

    # Optional: update first/last name if missing
    if not user.first_name:
        user.first_name = extra_data.get("given_name", "")
    if not user.last_name:
        user.last_name = extra_data.get("family_name", "")

    user.save()
