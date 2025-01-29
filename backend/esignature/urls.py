from django.urls import path
from esignature.views import SendContractForSigning


urlpatterns = [
    path("send/", SendContractForSigning.as_view(), name="send-contract-for-signing"),
]
