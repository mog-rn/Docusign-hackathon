from django.urls import path
from esignature.views import SendContractForSigning, CreateSender


urlpatterns = [
    path(
        "send-contract/",
        SendContractForSigning.as_view(),
        name="send-contract-for-signing",
    ),
    path(
        "create-sender/",
        CreateSender.as_view(),
        name="create-sender",
    ),
]
