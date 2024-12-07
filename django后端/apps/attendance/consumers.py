from channels.generic.websocket import AsyncWebsocketConsumer
from rest_framework.authtoken.models import Token
from django.contrib.auth.models import User
from urllib.parse import parse_qs
from asgiref.sync import sync_to_async
import json
from apps.attendance.models import Message

class SignInConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        query_params = parse_qs(self.scope['query_string'].decode('utf-8'))
        token_key = query_params.get('token')
        if token_key:
            try:
                # 由于WebSocket和其他异步通信方式需要非阻塞的操作，
                # 而Django的ORM（Object-Relational Mapping）默认是同步的，这意味着它可能会阻塞事件循环。
                # 将同步的Django ORM调用转换为异步调用
                token = await sync_to_async(Token.objects.get)(key=token_key[0])
                self.user = await sync_to_async(lambda: token.user)()
                # 尝试获取学生对象
                try:
                    self.student = await sync_to_async(lambda: self.user.student)()
                except User.student.RelatedObjectDoesNotExist:
                    self.student = None  # 设置为 None 以表示没有关联的学生
                    # 如果没有学生，尝试获取老师对象
                    try:
                        self.teacher = await sync_to_async(lambda: self.user.teacher)()
                        if self.teacher is None:
                            await self.close()  # 如果没有老师，关闭连接
                            return
                    except User.teacher.RelatedObjectDoesNotExist:
                        self.teacher = None
                        await self.close()  # 如果没有老师，关闭连接
                        return
            except Token.DoesNotExist:
                await self.close()
                return
        else:
            await self.close()
            return
        self.class_id = self.scope['url_route']['kwargs']['class_id']
        self.group_name = f'class_{self.class_id}'

        await self.channel_layer.group_add(
            self.group_name,
            self.channel_name
        )
        await self.accept()

    async def disconnect(self, close_code):
        await self.channel_layer.group_discard(
            self.group_name,
            self.channel_name
        )

    async def receive(self, text_data):
        text_data_json = json.loads(text_data)
        message = text_data_json['message']

        # 判断用户是学生还是老师，并设置相应的头像
        if self.student is not None:
            avatar_url = self.student.avatar.url if self.student.avatar else "/media/avatars/student_avatar.png"
        elif self.teacher is not None:
            avatar_url = self.teacher.avatar.url if self.teacher.avatar else "/media/avatars/teacher_avatar.png"
        else:
            avatar_url = "/media/avatars/avatar.png"  # 默认头像，作为备选

        # 异步保存聊天消息到数据库
        await sync_to_async(Message.objects.create)(
            sender=self.user,
            class_id=self.class_id,
            message=message,
        )
        # 发送消息到房间组
        await self.channel_layer.group_send(
            self.group_name,
            {
                'type': 'chat_message',
                'message': message,
                'username': self.user.username,
                'avatar':avatar_url,
            }
        )

    async def chat_message(self, event):
        message = event['message']
        username = event['username']
        avatar=event['avatar']
        # 发送消息到 WebSocket
        await self.send(text_data=json.dumps({
            'message': message,
            'username': username,
            'avatar': avatar,
        }))

    async def checkin_message(self, event):
        message = event['message']
        username = event['username']
        avatar = event['avatar']
        activity_id = event['activity_id']
        # 发送消息到 WebSocket
        await self.send(text_data=json.dumps({
            'message': message,
            'username': username,
            'avatar': avatar,
            'activity_id': activity_id,
        }))
