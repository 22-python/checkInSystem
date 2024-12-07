
from django.contrib import admin
from django.urls import path,include

from apps.accounts import views
from mysqlhomeWork import settings
from django.conf.urls.static import static
urlpatterns = [
    # path('admin/', admin.site.urls),
    path('accounts/', include('apps.accounts.urls')),
    # path('chats/', include('apps.chats.urls')),
    path('attendance/', include('apps.attendance.urls')),
]
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)