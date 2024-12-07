### 生成文件
python manage.py makemigrations
### 数据库生成 
python manage.py migrate
### 打开shell
python manage.py shell


### 班级表插入数据                                                                 
    from apps.attendance.models import Class
    new_class = Class.objects.create(class_name='计算机科学1班')
    new_class = Class.objects.create(class_name='计算机科学2班')
    new_class = Class.objects.create(class_name='软件工程1班')
    new_class = Class.objects.create(class_name='软件工程2班')
    new_class = Class.objects.create(class_name='大数据1班')
    new_class = Class.objects.create(class_name='大数据2班')
    new_class = Class.objects.create(class_name='信息管理1班')

### 导入学生
    import pandas as pd
    from django.contrib.auth.models import User
    from apps.accounts.models import Student
    from apps.attendance.models import Class
    # 读取 Excel 文件
    df = pd.read_excel(r'D:\Python\Pycharm\code\mysqlhomeWork\students.xlsx', header=None)
    df.columns = ['student_id', 'name', 'gender', 'class_id']
    # 遍历每一行数据
    for index, row in df.iterrows():
        student_id = row['student_id']
        name = row['name']
        gender = row['gender']
        class_id = row['class_id']
        # 获取班级实例
        try:
            class_instance = Class.objects.get(class_id=class_id)
        except Class.DoesNotExist:
            print(f"班级 ID {class_id} 不存在，跳过该学生。")
            continue
        # 创建用户
        user = User.objects.create_user(username=name, password='000000')  # 默认密码，可改为随机密码
        # 创建学生实例
        student = Student.objects.create(user=user, student_id=student_id, name=name, gender=gender, class_id=class_instance)
        print(f"学生 {name} 已成功导入。")
### 导入老师
    import pandas as pd
    from django.contrib.auth.models import User
    from apps.accounts.models import Teacher
    from apps.attendance.models import Class
     # 创建用户
    user = User.objects.create_user(username='郑玉彤', password='000000')  # 默认密码，可改为随机密码
    # 创建老师实例
    teacher = Teacher.objects.create(user=user, teacher_id=234567, name='郑玉彤', gender='F')
     # 创建用户
    user = User.objects.create_user(username='王小波', password='000000')  # 默认密码，可改为随机密码
    # 创建老师实例
    teacher = Teacher.objects.create(user=user, teacher_id=123456, name='王小波', gender='M')

### 实现签到推送
实时推送：适用于对即时性要求较高的应用，但需要配置 WebSocket 服务器。  
轮询：简单易用，但可能会造成不必要的请求浪费。  
推送通知：适合需要发送通知的场景，需实现推送服务。

# websocket实现签到
## 创建django项目
    setting中添加环境
    实现一个基于 Django WebSocket 的签到系统的思路如下：
    1. 数据模型设计
    班级表（Class）：存储班级信息，例如班级名称、年级等。
    学生表（Student）：存储学生信息，包括姓名、班级ID（外键）等。
    老师表（Teacher）：存储老师信息，包括姓名、授课班级等。
    签到活动表（AttendanceEvent）：记录每次签到的活动，例如签到标题、创建时间、相关班级等。
    签到记录表（AttendanceRecord）：记录每位学生的签到状态，例如学生ID、签到活动ID、签到时间等。
       2. WebSocket 服务器
       使用 Django Channels 创建 WebSocket 服务器，处理与客户端的实时通信。
       当老师选择班级并发送签到请求时，通过 WebSocket 将该请求推送到对应班级的所有学生。
       3. 前端实现
       在学生端的页面中，建立 WebSocket 连接，监听签到事件。
       当老师发起签到请求时，前端接收到消息并显示签到界面。
       4. 签到逻辑
       老师选择班级并发送签到请求：
    
    在老师的界面中，选择要发送签到的班级并点击“签到”按钮。
    WebSocket 将签到请求发送到服务器。
    服务器处理签到请求：
    
    服务器接收请求后，查找所选班级的所有学生。
    通过 WebSocket 向所有学生发送签到消息，包含签到活动的详细信息（例如活动ID、时间等）。
    学生端接收签到通知：
    
    学生端接收到签到通知后，显示签到信息（例如签到活动标题、签到时间）并提供签到按钮。
    学生点击签到按钮，触发签到请求。
    签到记录处理：
    
    学生的签到请求通过 WebSocket 发送到服务器。
    服务器接收签到请求，并在 AttendanceRecord 表中记录该学生的签到状态（包括学生ID、活动ID、签到时间等）。
    5. 界面交互
    老师和学生的界面可以设计为简洁易用，确保在签到期间的交互流畅。
    可以使用 JavaScript 或者框架（如 Vue.js、React）来实现 WebSocket 客户端的逻辑和页面的实时更新。

 
