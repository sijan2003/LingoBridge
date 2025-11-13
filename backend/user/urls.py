from django.urls import path
from .views import CustomTokenObtainPairView, UserProfileView, RegisterView
from rest_framework_simplejwt.views import ( TokenRefreshView)

urlpatterns = [
    path('profile/', UserProfileView.as_view(), name='user-profile'),
    path('register/', RegisterView.as_view(), name='register'),
    path('token/', CustomTokenObtainPairView.as_view(), name='custom_token_obtain_pair'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
]