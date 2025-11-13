# accounts/views.py
from dj_rest_auth.registration.views import SocialLoginView
from allauth.socialaccount.providers.google.views import GoogleOAuth2Adapter
from allauth.socialaccount.providers.oauth2.client import OAuth2Client
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework import status
from django.conf import settings


class GoogleLogin(SocialLoginView):
    adapter_class = GoogleOAuth2Adapter
    client_class = OAuth2Client
    callback_url = None

    def get_response(self):
        # Skip any redirect; return JSON directly
        original_response = super().get_response()
        return original_response


class AccountInactiveView(APIView):
    def get(self, request, *args, **kwargs):
        return Response(
            {
                "detail": "Your account is inactive. Please verify your email or contact support."
            },
            status=status.HTTP_403_FORBIDDEN,
        )


# apps/social_app/views.py
from google.oauth2 import id_token
from google.auth.transport import requests as google_requests
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from django.conf import settings
from django.contrib.auth import get_user_model
from apps.social_app.utils.create_jwt import create_jwt_for_user

User = get_user_model()


class GoogleIdentityLoginAPIView(APIView):
    """
    Handles Google Identity Services login with ID token
    """

    def post(self, request, *args, **kwargs):
        id_token_str = id_token_str = request.data.get("id_token") or request.data.get("credential")
        print('token',id_token_str)
        if not id_token_str:
            return Response(
                {"error": "Missing id_token"}, status=status.HTTP_400_BAD_REQUEST
            )

        try:
            # Verify the token with Google
            idinfo = id_token.verify_oauth2_token(
                id_token_str,
                google_requests.Request(),
                settings.SOCIAL_AUTH_GOOGLE_OAUTH2_KEY,
            )
        except ValueError:
            return Response(
                {"error": "Invalid token"}, status=status.HTTP_400_BAD_REQUEST
            )

        # Extract user info
        email = idinfo.get("email")
        first_name = idinfo.get("given_name", "")
        last_name = idinfo.get("family_name", "")
        picture = idinfo.get("picture", "")

        if not email:
            return Response(
                {"error": "Email not provided by Google"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Get or create user
        user, created = User.objects.get_or_create(
            email=email,
            defaults={
                "username": email.split("@")[0],
                "first_name": first_name,
                "last_name": last_name,
                "social_only": True,
                "is_active": True,
                "is_customer":True,
                "is_email_verified": True,
                "profile_image": picture,
            },
        )

        # Generate JWT tokens
        access_token, refresh_token = create_jwt_for_user(user)

        return Response(
            {
                "access_token": access_token,
                "refresh_token": refresh_token,
                "user": {
                    "id": str(user.id),
                    "email": user.email,
                    "first_name": user.first_name,
                    "last_name": user.last_name,
                    "profile_image": (
                        user.profile_image.url if user.profile_image else None
                    ),
                },
            }
        )
