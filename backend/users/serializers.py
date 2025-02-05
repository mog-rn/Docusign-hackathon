from rest_framework import serializers

from users.models import User


class UserSerializer(serializers.ModelSerializer):
    """
    Serializer for Users.
    """

    class Meta:
        model = User
        fields = [
            "id",
            "email",
            "password",
            "first_name",
            "last_name",
            "created_at",
            "updated_at",
        ]
        extra_kwargs = {"password": {"write_only": True}}
        read_only_fields = ["id", "created_at", "updated_at"]

    def create(self, validated_data):
        """
        Creates a new user.
        """
        user = User.objects.create_user(**validated_data)
        return user
