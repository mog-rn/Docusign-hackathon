from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.views import TokenObtainPairView

from authentication.serializers import RegisterSerializer, CustomTokenObtainPairSerializer
from authentication.utils import login_response_constructor


class RegisterView(APIView):
    """
    Register a new user and return the access and refresh tokens.
    """
    def post(self, request, *args, **kwargs):
        serializer = RegisterSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.save()
            response_data = login_response_constructor(user)
            return Response(response_data, status=status.HTTP_201_CREATED)
        else:
            errors = serializer.errors
            email_errors = errors.get('email', None)

            if email_errors:
                if "user with this email already exists" in email_errors:
                    return Response(serializer.errors, status=status.HTTP_409_CONFLICT)
                elif 'The email provided does not belong to an organization' in email_errors:
                    return Response(serializer.errors, status=status.HTTP_422_UNPROCESSABLE_ENTITY)
                
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class CustomTokenObtainPairView(TokenObtainPairView):
    serializer_class = CustomTokenObtainPairSerializer