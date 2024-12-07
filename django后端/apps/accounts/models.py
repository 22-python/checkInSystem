# Django的ORM（对象关系映射）允许开发者通过定义Python类来操作数据库表，而无需直接编写SQL语句。
from django.db import models
from django.contrib.auth.models import User
from django import forms
#  Django 的 User 模型关联，而 Token 认证通常依赖于 User 模型
# 将 Student 和 Teacher 模型与 User 模型关联：
# 在 Student 和 Teacher 模型中添加一个 OneToOneField 或 ForeignKey 字段，用于关联 Django 的 User 模型
# 学生表：学号，姓名，性别，班级
# 继承自models.Model
class Student(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE)  # 关联到User表，一个一对一字段
    student_id = models.IntegerField(db_column="SNo",primary_key=True,null=False)  # 学号，唯一标识
    name = models.CharField(db_column="SName",max_length=100,null=False)
    gender = models.CharField(db_column="SGender",max_length=1, choices=[('M', '男'), ('F', '女')])  # 性别，get_gender_display()获取男或女
    class_id = models.ForeignKey('attendance.Class', db_column="SClass_id", on_delete=models.CASCADE)  # 班级，使用字符串引用
    avatar = models.ImageField(upload_to='avatars/', null=True, blank=True)  # 保存图片路径
# 在默认情况下生成的表名为App_class，如果要自己定义，需要使用Class Meta来定义
# 定义模型的元数据，元数据指的是在模型类中指定一些除字段外的信息，这些信息用于描述模型的行为和特性。
# 数据库表名，排序方式，唯一性约束，索引
    class Meta:
        managed = True
        db_table = 'Student'
    # __str__方法
    def __str__(self):
        return "学号:%s\n 姓名：%s\n 性别:%s\n 班级id:%s"%(self.student_id,self.name,self.gender,self.class_id)

#教师表：工号，姓名，性别
class Teacher(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE)  # 关联到User表
    teacher_id = models.IntegerField(db_column="TNo",primary_key=True,null=False)
    name = models.CharField(db_column="TName",max_length=100,null=False)
    gender = models.CharField(db_column="TGender", max_length=1, choices=[('M', '男'), ('F', '女')])
    avatar = models.ImageField(upload_to='avatars/', null=True, blank=True)  # 保存图片路径
    class Meta:
        managed = True
        db_table = 'Teacher'
    def __str__(self):
        return "工号:%s\n 姓名：%s\n 性别：%s"%(self.teacher_id,self.name,self.gender)

# 表单来处理头像的上传
class StudentAvatarForm(forms.ModelForm):
    class Meta:
        model = Student
        fields = ['avatar']

class TeacherAvatarForm(forms.ModelForm):
    class Meta:
        model = Teacher
        fields = ['avatar']


