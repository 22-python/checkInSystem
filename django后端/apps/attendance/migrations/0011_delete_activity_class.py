# Generated by Django 4.2.16 on 2024-11-08 06:13

from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('attendance', '0010_checkinactivity_qr_code'),
    ]

    operations = [
        migrations.DeleteModel(
            name='Activity_Class',
        ),
    ]
