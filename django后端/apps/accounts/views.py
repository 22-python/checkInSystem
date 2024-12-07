from django.contrib.auth.hashers import check_password
from django.shortcuts import render
from rest_framework.authtoken.models import Token
from apps.accounts.models import Student, Teacher
from django.http import JsonResponse
from rest_framework.permissions import IsAuthenticated
from rest_framework.decorators import api_view, permission_classes



def index(request):
    return render('')
# 登录
def Login(request):
    global user_model
    if request.method == 'POST':
        import json
        data = json.loads(request.body.decode('utf-8')) # 将请求体的字节流转换成字符串并解析为 JSON
        user_type = data.get('user_type')
        user_id = data.get('user_id')
        password = data.get('password')

        user_map = {
            'student': Student,
            'teacher': Teacher,
        }

        if user_type in user_map:
            try:
                user_model = user_map[user_type]
                user = user_model.objects.get(**{f"{user_type}_id": user_id})
                # **字典解包
                # 验证与 User 模型中的密码
                if check_password(password, user.user.password):  # 这里访问 User 模型的密码
                    token, created = Token.objects.get_or_create(user=user.user)
                    # login(request, user)
                    return JsonResponse({
                        'status': 'success',
                        'message': '登录成功',
                        'user_type': user_type,
                        'token': token.key
                    })
                else:
                    return JsonResponse({'status': 'error', 'message': '密码错误'}, status=400)
            except user_model.DoesNotExist:
                return JsonResponse({'status': 'error', 'message': f'{user_type}不存在'}, status=404)
        else:
            return JsonResponse({'status': 'error', 'message': '用户类型无效'}, status=400)
    else:
        return JsonResponse({'status': 'error', 'message': '请求方式错误'}, status=405)

# 上传头像
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def upload_student_avatar(request):
    # 获取当前用户的学生对象
    try:
        student = Student.objects.get(user=request.user)  # 根据当前用户查找学生
    except Student.DoesNotExist:
        return JsonResponse({"error": "学生信息未找到"}, status=404)
    # 获取上传的文件
    avatar = request.FILES.get('avatar')
    if avatar:
        student.avatar = avatar
        student.save()
        return JsonResponse({"message": "头像上传成功", "avatar_url": student.avatar.url}, status=200)
    else:
        return JsonResponse({"error": "未提供头像文件"}, status=400)
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def upload_teacher_avatar(request):
    try:
        teacher = Teacher.objects.get(user=request.user)
    except Teacher.DoesNotExist:
        return JsonResponse({"error": "老师信息未找到"}, status=404)
    # 获取上传的文件
    avatar = request.FILES.get('avatar')
    if avatar:
        teacher.avatar = avatar
        teacher.save()
        return JsonResponse({"message": "头像上传成功", "avatar_url": teacher.avatar.url}, status=200)
    else:
        return JsonResponse({"error": "未提供头像文件"}, status=400)





