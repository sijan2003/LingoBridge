from rest_framework import serializers
from rest_framework.exceptions import AuthenticationFailed
from dotenv import load_dotenv
from django.conf import settings

from apps.social_app.utils import google
from apps.social_app.utils.register import register_social_user


load_dotenv(".envs.dev")


class GoogleSocialAuthSerializer(serializers.Serializer):
    auth_token = serializers.CharField()

    def validate_auth_token(self, auth_token):
        user_data = google.Google.validate(auth_token)
        try:
            user_data["sub"]
        except:
            raise serializers.ValidationError(
                "The token is invalid or expired. Please try again."
            )

        if (
            user_data["aud"] != settings.GOOGLE_CLIENT_ID
        ):  # commented for testing purposes ; its needed to distinguish the app
            raise AuthenticationFailed("Oops, who are you?")

        user_id = user_data["sub"]
        email = user_data["email"]
        name = user_data["name"]
        first_name = user_data["given_name"]
        last_name = user_data["family_name"]
        profile_url = user_data["picture"]

        provider = "google"

        return register_social_user(
            provider=provider,
            user_id=user_id,
            email=email,
            name=name,
            first_name=first_name,
            last_name=last_name,
            profile_url=profile_url,
        )
