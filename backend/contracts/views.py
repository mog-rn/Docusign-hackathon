from rest_framework import generics, status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.exceptions import PermissionDenied
from django.shortcuts import get_object_or_404

from contracts.models import Contract
from contracts.serializers import ContractSerializer
from contracts.services.s3 import S3
from organizations.models import Organization
from core.permissions import IsOrganizationAdmin, can_access_organization


class ContractListCreateView(generics.ListCreateAPIView):
    """
    List contracts for user's organization or create a new one.
    """
    permission_classes = [IsAuthenticated, IsOrganizationAdmin]
    serializer_class = ContractSerializer

    def get_queryset(self):
        user = self.request.user
        organization = user.organization
        return Contract.objects.filter(organization=organization).prefetch_related('counterparties')

    def list(self, request, *args, **kwargs):
        """
        List contracts for organization.
        """

        queryset = self.get_queryset()
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def create(self, request, *args, **kwargs):
        """
        Create a new contract.
        """ 
        user = request.user
        
        file_path = request.data.get('file_path')
        if not file_path:
            return Response({'error': 'File path is required'}, status=status.HTTP_400_BAD_REQUEST)
    
        s3_client = S3()
        if not s3_client.check_object_exists(file_path):
            return Response({'error': 'File path does not exist in s3. Please provide appropriate upload key.'}, status=status.HTTP_400_BAD_REQUEST)
        
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save(organization=user.organization, created_by=user, last_modified_by=user)

        return Response(serializer.data, status=status.HTTP_201_CREATED)


class ContractRetrieveUpdateDestroyView(generics.RetrieveUpdateDestroyAPIView):
    """
    Retrieve, update or delete a contract.
    """
    permissions_classes = [IsAuthenticated, IsOrganizationAdmin]
    queryset = Contract.objects.all()
    serializer_class = ContractSerializer

    def check_organization_and_get_contract(self, request):
        """
        Check if the requested contract belongs to user's organization
        and return it. If not, raise PermissionDenied.
        """
        user = request.user
        organization = user.organization

        contract = self.get_object()

        if contract.organization != organization:
            raise PermissionDenied({'error': "The requested contract does not belong to user's organization"})
        
        return contract

    def retrieve(self, request, *args, **kwargs):    
        """
        Retrieve a contract.
        """   
        contract = self.check_organization_and_get_contract(request)
        serializer = self.get_serializer(contract)
        return Response(serializer.data, status=status.HTTP_200_OK)
    
    def update(self, request, *args, **kwargs):
        """
        Update a contract.
        """  
        contract = self.check_organization_and_get_contract(request) 
        partial = kwargs.pop('partial', False)
        serializer = self.get_serializer(contract, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        serializer.save()

        return Response(serializer.data, status=status.HTTP_200_OK)
    
    def destroy(self, request, *args, **kwargs):
        """
        Delete a contract.
        """ 
        contract = self.check_organization_and_get_contract(request)
        s3_client = S3()
        if s3_client.delete_object(contract.file_path):
            contract.delete()
            return Response({'message': 'Contract deleted successfully'}, status=status.HTTP_204_NO_CONTENT)
        return Response({'error': 'Could not delete contract'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class GeneratePresignedPostUrlView(APIView):
    """
    Generate a presigned post URL for uploading a file to S3.
    """
    permission_classes = [IsAuthenticated, IsOrganizationAdmin]

    def get(self, request, *args, **kwargs):
        user = request.user

        file_path = request.query_params.get('file_path')

        s3_client = S3()
        
        if file_path: # file_path is provided when we want to update existing file
            contract = get_object_or_404(Contract, file_path=file_path)

            if contract.organization != user.organization: # ensure the file belongs to organization
                return Response({'error': "The requested contract does not belong to user's organization"}, status=status.HTTP_403_FORBIDDEN)

        response = s3_client.generate_presigned_post_url(file_path)
        if response:
            return Response(response, status=status.HTTP_200_OK)
        return Response({'error': 'Could not generate upload URL'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class GeneratePresignedDownloadUrlView(APIView):
    """
    Generate a presigned download URL for downloading a file from S3.
    """
    permission_classes = [IsAuthenticated, IsOrganizationAdmin]

    def get(self, request, *args, **kwargs):
        user = request.user
        
        file_path = request.query_params.get('file_path')
        if not file_path:
            return Response({'error': 'File path is required'}, status=status.HTTP_400_BAD_REQUEST)
        
        contract = get_object_or_404(Contract, file_path=file_path)

        if contract.organization != user.organization:
            return Response({'error': "The requested contract does not belong to user's organization"}, status=status.HTTP_403_FORBIDDEN)
        
        s3_client = S3()
        
        download_url = s3_client.generate_presigned_url_expanded('get_object', file_path)

        if download_url:
            return Response({'url': download_url}, status=status.HTTP_200_OK)
        return Response({'error': 'Could not generate download URL'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
