from django.urls import path
from django.http import JsonResponse
from apps.social_app.api.v1.api import *
from .views import GoogleLogin , GoogleIdentityLoginAPIView

from django.urls import re_path

urlpatterns = [

    path("google-login/", GoogleIdentityLoginAPIView.as_view(), name="google_login"),

    re_path(r'register/social/(?P<backend>[^/]+)/$', SocialLoginAPI.as_view(), name='social-login-api'),
]