# Generated by Django 5.1.4 on 2025-02-05 07:29

import django.db.models.deletion
from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):

    initial = True

    dependencies = [
        ('authentication', '0001_initial'),
        ('organizations', '0001_initial'),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.AddField(
            model_name='invitation',
            name='invited_by',
            field=models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to=settings.AUTH_USER_MODEL),
        ),
        migrations.AddField(
            model_name='invitation',
            name='organization',
            field=models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to='organizations.organization'),
        ),
        migrations.AddField(
            model_name='invitation',
            name='role',
            field=models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to='organizations.role'),
        ),
        migrations.AddIndex(
            model_name='invitation',
            index=models.Index(fields=['email', 'organization'], name='invitations_email_053409_idx'),
        ),
        migrations.AddIndex(
            model_name='invitation',
            index=models.Index(fields=['expires_at'], name='invitations_expires_7f52c2_idx'),
        ),
    ]
