from django.db import models


# 班级表
class Class(models.Model):
    class_id = models.AutoField(primary_key=True)  # 使用 AutoField自动生成
    class_name = models.CharField(max_length=50,null=False)

    class Meta:
        managed = True
        db_table = 'Class'

    def __str__(self):
        return self.class_name

# 签到活动表
class CheckinActivity(models.Model):
    ACTIVITY_TYPE_CHOICES = [
        ('normal', '普通签到'),
        ('gesture', '手势签到'),
        ('location', '位置签到'),
        ('qr_code', '二维码签到'),
        ('checkin_code', '签到码'),
    ]
    activity_id = models.AutoField(primary_key=True) #活动id
    teacher = models.ForeignKey('accounts.Teacher', on_delete=models.CASCADE) #老师id
    activity_type = models.CharField(max_length=20, choices=ACTIVITY_TYPE_CHOICES) #活动类型
    duration = models.IntegerField()  # 活动持续时长，单位为分钟或小时
    scheduled_time = models.DateTimeField(null=True, blank=True)  # 定时发放的时间
    sent_time = models.DateTimeField(null=True, blank=True)  # 发送签到的时间
    late_duration = models.IntegerField()  # 允许迟到时长
    classes = models.ManyToManyField(Class, blank=True)  # 多班级参与关系
    isPhoto = models.BooleanField(default=False)  # 标记是否需要拍照
    gesture_code = models.CharField(max_length=100, null=True, blank=True)  # 手势签到码
    qr_code=models.CharField(max_length=100, null=True, blank=True)
    location = models.CharField(max_length=100, null=True, blank=True)  # 位置签到
    isUpdate= models.BooleanField(default=False)
    update_frequency= models.IntegerField(null=True, blank=True)
    checkin_range= models.IntegerField(null=True, blank=True)
    checkin_code = models.CharField(max_length=100, null=True, blank=True)  # 签到码

    class Meta:
        managed = True
        db_table = 'CheckinActivity'

    def __str__(self):
        return f"活动 ID: {self.activity_id} - 类型: {self.activity_type} - 教师: {self.teacher}"

# Activity_Class表（签到活动与班级表）
# class Activity_Class(models.Model):
#     activity_id = models.ForeignKey(CheckinActivity, on_delete=models.CASCADE)
#     class_id = models.ForeignKey(Class, on_delete=models.CASCADE)
#     class Meta:
#         managed = True
#         db_table = 'ActivityClass'
#         # 定义这两个字段的联合唯一性，确保组合在一起是唯一的
#         constraints = [
#             models.UniqueConstraint(fields=['activity_id', 'class_id'], name='unique_activity_class')
#         ]
#
#     def __str__(self):
#         return f'{self.activity_id} - {self.class_id}'
# 签到记录表
class CheckinForm(models.Model):
    STATUS_CHOICES = [
        ('present', '已签到'),
        ('late', '迟到'),
        ('absent', '未签到'),
    ]
    activity = models.ForeignKey(CheckinActivity, on_delete=models.CASCADE,related_name='checkins')  # 使用外键
    student = models.ForeignKey("accounts.Student", on_delete=models.CASCADE, related_name='checkins')  # 使用外键
    checkin_time = models.DateTimeField(null=True, blank=True)
    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default='absent')
    photo = models.ImageField(upload_to='check_photo/', null=True, blank=True)  # 保存图片路径
    class Meta:
        managed = True
        db_table = 'CheckinForm'
        constraints = [
            models.UniqueConstraint(fields=['activity', 'student'], name='unique_checkin'),
        ]

    def __str__(self):
        return f'活动id:{self.activity} - 学生：{self.student}-签到状态:{self.status}'


# 存储聊天信息
from django.contrib.auth.models import User
class Message(models.Model):
    sender = models.ForeignKey(User, on_delete=models.CASCADE)
    class_id = models.CharField(max_length=255)
    message = models.TextField()
    timestamp = models.DateTimeField(auto_now_add=True)
    def __str__(self):
        return f'{self.sender.username}: {self.message}'
