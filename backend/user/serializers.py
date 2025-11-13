from rest_framework import serializers
from .models import CustomUser
from django.contrib.auth import authenticate
from rest_framework import serializers
from django.contrib.auth import authenticate, get_user_model
from rest_framework_simplejwt.tokens import RefreshToken


User = get_user_model()

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = CustomUser
        fields = ['id', 'username', 'email', 'first_name', 'last_name',
                    'phone_number', 'is_active', 'is_staff',
                    'is_superuser', 'preferred_language', 'gender', 'address', 'is_premium', 'joined_at']



class CustomTokenObtainPairSerializer(serializers.Serializer):
    identifier = serializers.CharField(required=True)
    password = serializers.CharField(required=True, write_only=True)

    def validate(self, attrs):
        identifier = attrs.get("identifier")
        password = attrs.get("password")

        if not identifier or not password:
            raise serializers.ValidationError("Both identifier and password are required.")

        # Try username first
        user = authenticate(username=identifier, password=password)

        # If not found, try email
        if user is None:
            try:
                user_obj = User.objects.get(email=identifier)
                user = authenticate(username=user_obj.username, password=password)
            except User.DoesNotExist:
                user = None

        if user is None:
            raise serializers.ValidationError("No active account found with the given credentials.")

        # Generate JWT tokens
        refresh = RefreshToken.for_user(user)
        return {
            "refresh": str(refresh),
            "access": str(refresh.access_token),
            "user": {
                "id": user.id,
                "username": user.username,
                "email": user.email,
                "first_name": user.first_name,
                "last_name": user.last_name,
            },
        }


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(style={'input_type': 'password'}, write_only=True)
    class Meta:
        model = CustomUser
        fields = ['username', 'email', 'first_name', 'last_name','phone_number', 'password', 'preferred_language', 'gender', 'address']
        def create(self, validated_data):
            user = CustomUser.objects.create_user(**validated_data)
            return user