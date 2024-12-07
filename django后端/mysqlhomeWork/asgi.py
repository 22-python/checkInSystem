"""
ASGI config for mysqlhomeWork project.

It exposes the ASGI callable as a module-level variable named ``application``.

For more information on this file, see
https://docs.djangoproject.com/en/4.2/howto/deployment/asgi/
"""

import os
from channels.routing import ProtocolTypeRouter, URLRouter
from django.core.asgi import get_asgi_application
from channels.auth import AuthMiddlewareStack
import mysqlhomeWork.routing  # 引入你的路由
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'mysqlhomeWork.settings')

application = ProtocolTypeRouter({
    "http": get_asgi_application(),
    "websocket": AuthMiddlewareStack(
        URLRouter(
            mysqlhomeWork.routing.websocket_urlpatterns  # 引用你的 WebSocket 路由
        )
    ),
})