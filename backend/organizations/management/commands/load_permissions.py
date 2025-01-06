import json
import os
from django.core.management.base import BaseCommand
from organizations.models import Role, Organization


class Command(BaseCommand):
    help = 'Load default permissions into the database'

    def handle(self, *args, **kwargs):
        # Get the path to the directory containing manage.py
        base_dir = os.path.dirname(os.path.abspath(__file__))
        root_dir = os.path.abspath(os.path.join(base_dir, "../../../"))
        permissions_file = os.path.join(root_dir, 'default_permissions.json')

        # Check if the file exists
        if not os.path.exists(permissions_file):
            self.stderr.write(self.style.ERROR(f"File not found: {permissions_file}"))
            return

        # Load permissions from the JSON file
        with open(permissions_file, 'r') as file:
            permissions = json.load(file)

        # Assign roles to a default organization (replace with a specific org ID if needed)
        default_organization, _ = Organization.objects.get_or_create(name="Default Organization")

        for role_name, perms in permissions.items():
            Role.objects.get_or_create(
                name=role_name,
                organization=default_organization,  # Ensure roles are tied to an organization
                defaults={"permissions": perms}
            )

        self.stdout.write(self.style.SUCCESS('Default permissions loaded successfully!'))
