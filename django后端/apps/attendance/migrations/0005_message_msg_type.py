# Generated by Django 4.2.16 on 2024-10-25 08:59

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('attendance', '0004_rename_content_message_message_and_more'),
    ]

    operations = [
        migrations.AddField(
            model_name='message',
            name='msg_type',
            field=models.CharField(default='chat', max_length=255),
            preserve_default=False,
        ),
    ]
