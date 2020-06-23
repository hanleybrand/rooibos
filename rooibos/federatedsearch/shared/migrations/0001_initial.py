# -*- coding: utf-8 -*-
# Generated by Django 1.11.17 on 2019-10-05 15:21
from __future__ import unicode_literals

from django.db import migrations, models


class Migration(migrations.Migration):

    initial = True

    dependencies = [
    ]

    operations = [
        migrations.CreateModel(
            name='SharedCollection',
            fields=[
                ('id', models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('title', models.CharField(max_length=100)),
                ('name', models.SlugField(blank=True, unique=True)),
                ('e_url', models.TextField(blank=True)),
                ('e_username', models.TextField(blank=True)),
                ('e_password', models.TextField(blank=True)),
                ('description', models.TextField(blank=True)),
            ],
            options={
                'ordering': ['title'],
            },
        ),
    ]