from django.contrib import admin
from django.urls import path
from apps.accounts import views
from django.conf import settings
from django.conf.urls.static import static
urlpatterns = [
    path('Login/', views.Login, name='Login'),
    path('upload_student_avatar/', views.upload_student_avatar, name='upload_student_avatar'),
    path('upload_teacher_avatar/', views.upload_teacher_avatar, name='upload_teacher_avatar'),
]
# 仅在开发模式下（DEBUG=True）启用此配置，用于提供媒体文件访问
