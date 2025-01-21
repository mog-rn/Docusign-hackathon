from django.urls import path
from contracts.views import GeneratePresignedPostUrlView, ContractListCreateView, GeneratePresignedDownloadUrlView, ContractRetrieveUpdateDestroyView

urlpatterns = [
    path('presigned-post-url/', GeneratePresignedPostUrlView.as_view(), name='upload'),
    path('presigned-download-url/', GeneratePresignedDownloadUrlView.as_view(), name='download'),
    path('', ContractListCreateView.as_view(), name='list-create-contracts'),
    path('<uuid:pk>/', ContractRetrieveUpdateDestroyView.as_view(), name='contract-retrieve-update-destroy')
]
