from apps.attendance import consumers
from django.urls import re_path

websocket_urlpatterns = [
    re_path(r'ws/sign_in/(?P<class_id>\w+)/$', consumers.SignInConsumer.as_asgi()),
]
