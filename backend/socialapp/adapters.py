# accounts/adapters.py
from allauth.socialaccount.adapter import DefaultSocialAccountAdapter
from django.contrib.auth import get_user_model

User = get_user_model()

class CustomSocialAccountAdapter(DefaultSocialAccountAdapter):
    """
    API-safe adapter for social login:
    - Creates new users automatically
    - Handles Google login
    - Prevents allauth from redirecting to 'socialaccount_signup'
    """

    def populate_user(self, request, sociallogin, data):
        """
        Called when a new social account is created.
        Populate extra fields from Google.
        """
        user = super().populate_user(request, sociallogin, data)

        user.username = data.get('username') or (data.get('email') or '').split('@')[0]
        user.email = data.get('email', "")
        user.first_name = data.get('first_name', "")
        user.last_name = data.get('last_name', "")

        # API login: always set active to True to avoid redirects
        user.is_active = True
        user.social_only = True

        # Email verification flag (for frontend handling)
        extra_data = sociallogin.account.extra_data
        user.is_email_verified = extra_data.get("email_verified", False)

        # Optional profile picture
        user.profile_image = data.get('picture', None)

        return user

    def pre_social_login(self, request, sociallogin):
        """Link social account to existing user if email already exists."""
        email = sociallogin.user.email
        if not email:
            return

        try:
            existing_user = User.objects.get(email__iexact=email)
        except User.DoesNotExist:
            return  # no existing user — allow allauth to create one

        # If social account is already linked, do nothing
        if sociallogin.is_existing:
            return

        # Link this social account to the existing user
        sociallogin.connect(request, existing_user)

    def save_user(self, request, sociallogin, form=None):
        """
        Save user data from Google after social login.
        """
        user = sociallogin.user
        extra_data = sociallogin.account.extra_data

        user.username = (extra_data.get("email") or "").split("@")[0]
        user.email = extra_data.get("email", "")
        user.first_name = extra_data.get("given_name", "")
        user.last_name = extra_data.get("family_name", "")
        user.social_only = True

        # API-safe: always active, handle email verification separately
        user.is_active = True
        user.is_email_verified = extra_data.get("email_verified", False)

        # Optional profile image
        user.profile_image = extra_data.get("picture", user.profile_image)

        user.save()
        return user

    def is_open_for_signup(self, request, sociallogin):
        """
        Allow automatic signup for API clients.
        """
        return True

    def get_connect_redirect_url(self, request, socialaccount):
        """
        Prevent any redirect to the signup page.
        """
        # Return safe API URL (frontend will handle post-login)
        return "/"
