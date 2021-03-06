# -*- coding: utf-8 -*-
# Generated by Django 1.11.17 on 2019-10-10 13:53
from __future__ import unicode_literals

from django.db import migrations, models


class Migration(migrations.Migration):

    initial = True

    dependencies = [
    ]

    operations = [
        migrations.CreateModel(
            name='HitCount',
            fields=[
                ('id', models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('query', models.CharField(db_index=True, max_length=255)),
                ('source', models.CharField(db_index=True, max_length=32)),
                ('hits', models.IntegerField()),
                ('results', models.TextField(blank=True, null=True)),
                ('valid_until', models.DateTimeField()),
            ],
        ),
    ]
