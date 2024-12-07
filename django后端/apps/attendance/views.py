import base64
import math
from datetime import timedelta
from operator import truediv
from tabnanny import check

from django.contrib.auth import update_session_auth_hash
import pytz
from django.core.files.base import ContentFile
from django.http import JsonResponse
from exceptiongroup import catch
from pandas.core.interchange.from_dataframe import primitive_column_to_ndarray
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from apps.accounts.models import Teacher, Student
from apps.attendance.models import CheckinForm, CheckinActivity, Class, Message
from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync
import json
# 获取学生签到信息
# @api_view(['GET'])
# @permission_classes([IsAuthenticated])  # 确保用户已认证
def getStudentsByStatus(request):
    print("Received request for getStudentsByStatus")
    if request.method == "GET":
        selected_class_id = request.GET.get('selectedClassId')  # 获取前端传递的 selectedClassId 参数
        activityId = request.GET.get('activityId')  # 获取前端传递的 activityId 参数
        # print(selected_class_id)
        # print(activityId)
        # 获取该班级的所有学生
        all_students = Student.objects.filter(class_id=selected_class_id)
        # print(all_students)
        students_list = {
            'present': [],
            'late': [],
            'absent': [],
            'all': []
        }
        # 查询班级和活动的关联
        exists = CheckinActivity.objects.filter(
            activity_id=activityId,
            classes__class_id=selected_class_id  # 注意：这里的 classes__id 指的是关联的班级的 ID
        ).exists()

        if not exists:
            return JsonResponse({
                'message': '该班级没有发布签到活动',
                'code': 0,
                'students': students_list
            })
        # 查询符合条件的签到记录
        checked_students = CheckinForm.objects.select_related('student', 'activity').filter(
            student__class_id=selected_class_id,  # 通过班级ID进行筛选
            activity_id=activityId  # 通过活动ID进行筛选
        )
        # print(checked_students)
        # 创建已签到学生的ID集合
        checked_student_ids = set()

        for checkin in checked_students:
            print(checkin.checkin_time)
            checkin_photo = checkin.photo.url if checkin.photo else None  # 获取头像 URL
            student = checkin.student
            checked_student_ids.add(student.student_id)

            # 判断 checkin_time 是否为 None
            utc_time = checkin.checkin_time
            # 设置时区为北京时间
            beijing_tz = pytz.timezone('Asia/Shanghai')
            # 将 UTC 时间转换为北京时间
            beijing_time = utc_time.astimezone(beijing_tz)
            # 格式化为字符串
            checkin_time_str = beijing_time.strftime('%Y-%m-%d %H:%M:%S')

            # 根据状态将学生信息添加到对应的列表中
            students_list[checkin.status].append({
                'student_id': student.student_id,
                'name': student.name,
                'gender': student.get_gender_display(),
                'checkin_time': checkin_time_str,
                'status': checkin.get_status_display(),
                'checkin_photo': checkin_photo,
            })

            # 将学生信息添加到 all 列表中
            students_list['all'].append({
                'student_id': student.student_id,
                'name': student.name,
                'gender': student.get_gender_display(),
                'checkin_time': checkin_time_str,
                'status': checkin.get_status_display(),
                'checkin_photo': checkin_photo,
            })

        # 遍历该班级的所有学生，检查未签到的学生
        for student in all_students:
            if student.student_id not in checked_student_ids:
                students_list['absent'].append({
                    'student_id': student.student_id,
                    'name': student.name,
                    'gender': student.get_gender_display(),
                    'checkin_time': "无",
                    'status': "未签到",
                    'checkin_photo': None,
                })
                students_list['all'].append({
                    'student_id': student.student_id,
                    'name': student.name,
                    'gender': student.get_gender_display(),
                    'checkin_time': "无",
                    'status': "未签到",
                    'checkin_photo': None,
                })

        # 返回 JSON 响应
        return JsonResponse({
            'message': '获取签到状态',
            'code': 1,
            'students': students_list
        })
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def publish_and_send_checkin(request):
    user = request.user
    # 获取请求中的数据
    checkmessage = request.data
    print(checkmessage)
    # 获取当前用户关联的教师实例
    try:
        teacher = Teacher.objects.get(user=user)
        # 获取用户头像 URL
        head_photo_url = teacher.avatar.url if teacher.avatar else ''  # 获取头像 URL
    except Teacher.DoesNotExist:
        return JsonResponse({"code": 404, "message": "未找到教师信息"}, status=404)
    # 检查 checkmessage 是否存在
    if not checkmessage:
        return JsonResponse({"code": 400, "message": "无效的数据"}, status=400)
    # 创建 CheckinActivity 实例
    checkin_activity = CheckinActivity(
        teacher=teacher,
        activity_type=checkmessage.get('activity_type'),
        duration=checkmessage.get('duration'),
        scheduled_time=checkmessage.get('scheduled_time'),# 定时发放时间
        late_duration=checkmessage.get('late_duration'),
        isPhoto=checkmessage.get('requirePhoto', False),
        gesture_code=checkmessage.get('gesture_code'),
        location=checkmessage.get('location'),
        isUpdate=checkmessage.get('updatecode'),
        update_frequency=checkmessage.get('updateFrequency'),
        checkin_code=checkmessage.get('qiandaocode'),
        checkin_range=checkmessage.get('checkin_range'),
        sent_time=checkmessage.get('sent_time'),  # 存储发送时间
        qr_code=checkmessage.get('qr_code')
    )

    # 保存到数据库
    checkin_activity.save()
    # 将班级与签到活动关联
    class_ids = []
    classes = checkmessage.get('selectedClasses', [])
    for class_name in classes:
        try:
            class_instance = Class.objects.get(class_name=class_name)
            checkin_activity.classes.add(class_instance)
            class_ids.append(class_instance.class_id)
        except Class.DoesNotExist:
            continue

    # 获取 Channel Layer
    channel_layer = get_channel_layer()
    if channel_layer is None:
        return JsonResponse({'error': '通道层未正确配置'}, status=500)

    # 发送签到消息
    for class_id in class_ids:
        async_to_sync(channel_layer.group_send)(
            f'class_{class_id}',
            {
                'type': 'checkin_message',
                'message': f'您有新的签到信息！！！',
                'username': teacher.name,
                'avatar': teacher.avatar.url,
                'activity_id': checkin_activity.activity_id,  # 添加 activity_id
            }
        )
    # 返回响应
    return JsonResponse({
        "code": 200,
        "message": "发送签到成功",
    })

# 获取学生班级
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def student_info(request):
    try:
        user = request.user  # 获取当前登录的用户
        # 尝试获取学生实例
        try:
            # print("user：", user.id)
            student = Student.objects.get(user=user)  # 获取当前用户对应的学生
            # print("学生：", student)
            # 获取班级 ID 和班级名称,user_id
            class_id = student.class_id.class_id if student.class_id else None  # 获取班级 ID
            class_name = student.class_id.class_name if student.class_id else None  # 获取班级名称
            student_id=student.student_id
            student_name=student.name
            if student.gender == 'M':
                gender = '男'
            elif student.gender == 'F':
                gender = '女'
            # print("学生id：", student_id)
            avatar=student.avatar.url if student.avatar else None
            if class_id is not None and class_name is not None:
                return JsonResponse({'class_id': class_id,
                                     'class_name': class_name,
                                     'avatar':avatar,
                                     'student_id':student_id,
                                     'student_name':student_name,
                                     'gender':gender,
                                     })  # 返回班级 ID 和名称
            else:
                return JsonResponse({'error': '用户未关联班级'}, status=400)  # 返回用户未关联班级的错误
        except Student.DoesNotExist:
            return JsonResponse({"code": 404, "message": "未找到学生信息"}, status=404)
    except Exception as e:
        # 捕获并返回异常信息
        return JsonResponse({'error': str(e)}, status=500)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def teacher_info(request):
    try:
        user = request.user  # 获取当前登录的用户
        print("?",user)
        # 尝试获取教师实例
        try:
            teacher = Teacher.objects.get(user=user)  # 获取当前用户对应的教师
            teacher_id = teacher.teacher_id
            teacher_name = teacher.name
            # 判断性别
            if teacher.gender == 'M':
                gender = '男'
            elif teacher.gender == 'F':
                gender = '女'
            else:
                gender = '未知'  # 如果性别字段不符合预期

            # 获取头像URL
            avatar = teacher.avatar.url if teacher.avatar else None

            return JsonResponse({
                'avatar': avatar,
                'teacher_id': teacher_id,
                'teacher_name': teacher_name,
                'gender': gender
            })  # 返回教师信息

        except Teacher.DoesNotExist:
            return JsonResponse({"code": 404, "message": "未找到教师信息"}, status=404)

    except Exception as e:
        # 捕获并返回异常信息
        return JsonResponse({'error': str(e)}, status=500)


# 查询历史聊天信息
def get_chat_messages(request, class_id):
    # 查询与 class_id 相关的所有聊天消息，按时间戳排序
    messages = Message.objects.filter(class_id=class_id).order_by('timestamp')
    checkin_messages = CheckinActivity.objects.filter(classes__class_id=class_id).order_by('sent_time')

    checkin_messages_list=[
        {
            'sender': checkin_message.teacher.name,
            'message': "你有一条签到信息！！！",
            'timestamp': checkin_message.sent_time,
            'avatar': checkin_message.teacher.avatar.url,
            'activity_id':checkin_message.activity_id,
        }
        for checkin_message in checkin_messages
    ]
    # 将消息转换为可以序列化的字典列表
    message_list = [
        {
            'sender': message.sender.username,
            'message': message.message,
            'timestamp': message.timestamp,
            # 判断发送者类型并获取头像
            'avatar': (
                message.sender.student.avatar.url if hasattr(message.sender, 'student') and message.sender.student.avatar else ''
                if hasattr(message.sender, 'student') else
                message.sender.teacher.avatar.url if hasattr(message.sender, 'teacher') and message.sender.teacher.avatar else ''
            ),
        }
        for message in messages
    ]

    # 合并两个列表
    all_messages = message_list + checkin_messages_list
    # 按时间戳排序
    sorted_messages = sorted(all_messages, key=lambda x: x['timestamp'])
    # 返回合并后的消息列表给前端
    return JsonResponse({'messages': sorted_messages})

# 获取班级名称
def get_ClassName(request):
    if request.method == "GET":
        class_names = Class.objects.all().values("class_id", "class_name")  # 选择需要的字段
        return JsonResponse(list(class_names), safe=False)

from django.utils.dateparse import parse_datetime
from datetime import datetime, timedelta
# 进行签到

def isCheckin(request):
    if request.method == 'POST':
        data = json.loads(request.body)
        activity_id = data.get('activity_id')
        student_id = data.get('student_id')
        # 获取对应的 CheckinActivity 对象
        checkin_activity = CheckinActivity.objects.get(activity_id=activity_id)
        # 取得 isPhoto和checkin_activity的值
        is_photo = checkin_activity.isPhoto
        activity_type=checkin_activity.activity_type
        checkin_record = CheckinForm.objects.filter(activity_id=activity_id, student_id=student_id)
        if checkin_record.exists():
            # 获取签到记录的时间和状态
            checkin_time_str = checkin_record[0].checkin_time
            checkinPhoto = checkin_record[0].photo.url if checkin_record[0].photo else None  # 检查 photo 是否存在

            return JsonResponse({
                'message': '已有签到记录',
                'status': checkin_record[0].status,  # 返回状态
                'checkinPhoto': checkinPhoto,
                'checkinTime': checkin_time_str,
                'isFirst': 'False',
            }, status=200)
        else:
            return JsonResponse({
                'message': '没有签到记录',
                'is_photo':is_photo,
                'activity_type':activity_type,
                'isFirst': 'True',
            })

# Haversine 公式计算两点之间的距离
def calculate_distance(lat1, lon1, lat2, lon2):
    # 地球半径，单位：米
    R = 6371000
    # 将经纬度转换为弧度
    x1 = math.radians(lat1)
    x2= math.radians(lat2)
    y1= math.radians(lat2 - lat1)
    y2= math.radians(lon2 - lon1)
    a = math.sin(y1 / 2) * math.sin(y1 / 2) + math.cos(x1) * math.cos(x2) * math.sin(y2 / 2) * math.sin(y2 / 2)
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    # 计算距离，单位：米
    return R * c
def Checkin(request):
    if request.method == 'POST':
        try:
            data = json.loads(request.body)
            print(data)
            activity_id = data.get('activity_id')
            checkin_time = parse_datetime(data.get('checkin_time'))
            student_id=data.get('student_id')
            activity_type = data.get('activity_type')  # 获取签到类型
            photoDataUrl=data.get('photoDataUrl')
            qiandaocode=data.get('qiandaocode')
            gesture_code=data.get('gesture_code')
            qrcode=data.get('qrcode')
            # 获取位置数据
            location = data.get('location')  # 获取 location 字典
            if location:
                lat = location.get('lat')  # 获取纬度
                lng = location.get('lng')  # 获取经度

            # 解析 base64 数据
            if photoDataUrl:  # 判断 photoDataUrl 是否不为空
                # 解析 base64 数据
                format, imgstr = photoDataUrl.split(';base64,')  # 分离格式和数据
                ext = format.split('/')[-1]  # 获取文件扩展名
                image_data = base64.b64decode(imgstr)  # 解码图片数据
                # 保存图像到数据库
                photo_name = f'{student_id}_checkin_{activity_id}.{ext}'  # 以学生 ID 和活动 ID 命名文件
                # print(photo_name)
                image = ContentFile(image_data, name=photo_name)
            else:
                image = None  # 设置 image 为 None，表示没有上传照片
            # 获取活动对象
            check_activity = CheckinActivity.objects.get(activity_id=activity_id)
            scheduled_time = check_activity.scheduled_time
            sent_time = check_activity.sent_time
            duration = check_activity.duration
            late_duration = check_activity.late_duration
            checkin_range=check_activity.checkin_range



            # 1. 判断定时签到是否开始
            if scheduled_time and checkin_time < scheduled_time:
                return JsonResponse({'message': '活动尚未开始','status':'not_started'}, status=200)

           # 2. 判断签到时间
            end_time = sent_time + timedelta(minutes=duration)
            late_cutoff_time = end_time + timedelta(minutes=late_duration)
            # 针对不同类型的签到进行处理
            if activity_type == "签到码":
                if str(qiandaocode) == str(check_activity.checkin_code):
                    print("签到成功")
                else:
                    return JsonResponse({
                        'message': '签到码错误',
                        'status': 'error'
                    } ,status=200)
            elif activity_type == "二维码":
                if str(qrcode) == str(check_activity.qr_code):
                    print("签到成功")
                else:
                    return JsonResponse({
                        'message': '签到错误',
                        'status': 'error'
                    }, status=200)
            elif activity_type == "位置":
                location=check_activity.location
                # 获取活动的签到位置，经纬度
                # 拆分活动的经纬度字符串（例如 '39.811228_116.108934'）
                activity_lat, activity_lon = map(float, location.split('_'))  # 转换为浮动数值
                print('activity_lat',activity_lat)
                print('activity_lon',activity_lon)

                # 计算签到位置与活动位置的距离
                distance = calculate_distance(activity_lat, activity_lon, lat, lng)

                # 判断距离是否在允许的范围内
                if distance <= checkin_range:
                    print("签到成功，位置符合要求")
                    print("距离:",distance)
                else:
                    return JsonResponse({
                        'message': f"签到位置距离过远，实际距离：{distance}米，最大允许距离：{checkin_range}米",
                        'status': 'error'
                    }, status=200)
            elif activity_type == "手势":
                if str(gesture_code) == str(check_activity.gesture_code):
                    print("签到成功")
                else:
                    return JsonResponse({
                        'message': '手势码错误',
                        'status': 'error'
                    }, status=200)

            if checkin_time <= end_time:
                CheckinForm.objects.create(
                    activity_id=activity_id,
                    student_id=student_id,
                    checkin_time=checkin_time,
                    status='present',
                    photo=image,  # 将图像保存到模型的 photo 字段
                )
                return JsonResponse({
                    'message': '签到成功',
                    'status':'present',
                    'checkinTime':checkin_time,},
                    status=200)

            elif end_time < checkin_time <= late_cutoff_time:
                CheckinForm.objects.create(
                    activity_id=activity_id,
                    student_id=student_id,
                    checkin_time=checkin_time,
                    status='late',
                    photo=image,  # 将图像保存到模型的 photo 字段

                )
                return JsonResponse({
                    'message': '签到成功，但标记为迟到',
                    'status':'late',
                    'checkinTime':checkin_time,},
                    status=200)
            else:
                CheckinForm.objects.create(
                    activity_id=activity_id,
                    student_id=student_id,
                    checkin_time=checkin_time,
                    status='absent',
                    photo=image,  # 将图像保存到模型的 photo 字段
                )
                return JsonResponse({
                    'message': '签到已过期',
                    'status':'absent',
                    'checkinTime':checkin_time,},
                    status=200)

        except CheckinActivity.DoesNotExist:
            return JsonResponse({'error': '活动不存在'}, status=404)
        except Exception as e:
            return JsonResponse({'error': str(e)}, status=400)

    return JsonResponse({'error': 'Invalid request method'}, status=405)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def change_password(request):
    if request.method == 'POST':
        try:
            print('request.body', request.body)
            data = json.loads(request.body.decode('utf-8'))
            current_password = data.get("current_password")
            new_password = data.get("new_password")
            # 获取当前用户
            user = request.user
            # 验证当前密码
            if not user.check_password(current_password):
                return JsonResponse({'message': '当前密码错误'}, status=400)
            # 更新密码
            user.set_password(new_password)
            user.save()
            update_session_auth_hash(request, user)  # 重要：保持用户登录状态
            return JsonResponse({'message': '密码修改成功'}, status=200)
        except Exception as e:
            return JsonResponse({'error': str(e)}, status=400)
    return JsonResponse({'error': 'Invalid request method'}, status=405)



from django.db.models import Count
# 获取签到信息
def get_checkrecord(request):
    if request.method == 'GET':
        student_id = request.GET.get('student_id')  # 从查询参数中获取 student_id
        # 获取某个学生的签到统计
        checkin_stats = CheckinForm.objects.filter(student_id=student_id) \
            .values('status') \
            .annotate(count=Count('status'))
        # 将结果按签到状态分类
        status_dict = {
            'present': 0,
            'late': 0,
            'absent': 0,
        }
        for stat in checkin_stats:
            status_dict[stat['status']] = stat['count']

        return JsonResponse(status_dict)
