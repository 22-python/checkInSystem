# Generated by Django 4.2.16 on 2024-10-24 13:51

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('attendance', '0003_message'),
    ]

    operations = [
        migrations.RenameField(
            model_name='message',
            old_name='content',
            new_name='message',
        ),
        migrations.RenameField(
            model_name='message',
            old_name='user',
            new_name='sender',
        ),
        migrations.AddField(
            model_name='message',
            name='class_id',
            field=models.CharField(default=1, max_length=255),
            preserve_default=False,
        ),
    ]
