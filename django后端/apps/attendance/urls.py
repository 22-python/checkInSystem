from django.urls import path
from apps.attendance import views

urlpatterns = [
    path('getStudentsByStatus/', views.getStudentsByStatus, name='getStudentsByStatus'),
    # path('publish_checkin/', views.publish_checkin, name='publish_checkin'),
    # # path('check_sign_in/', views.check_sign_in, name='check_sign_in'),
    # path('send_sign_in/', views.send_sign_in, name='send_sign_in'),
    path('student_info/', views.student_info, name='student_info'),
    path('teacher_info/', views.teacher_info, name='teacher_info'),
    path('publish_and_send_checkin/', views.publish_and_send_checkin, name='publish_and_send_checkin'),
    path('get_chat_messages/<str:class_id>/', views.get_chat_messages, name='get_chat_messages'),
    path('get_ClassName/', views.get_ClassName, name='get_ClassName'),
    path('Checkin/', views.Checkin, name='Checkin'),
    path('isCheckin/', views.isCheckin, name='isCheckin'),
    path('change_password/', views.change_password, name='change_password'),
    path('get_checkrecord/', views.get_checkrecord, name='get_checkrecord'),
]