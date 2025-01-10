from django.urls import path

from counterparties.views import CounterpartyListCreateView, CounterpartyRetrieveUpdateDestroyView

urlpatterns = [
    path('', CounterpartyListCreateView.as_view(), name='list-create-counterparties'),
    path('<uuid:pk>/', CounterpartyRetrieveUpdateDestroyView.as_view(), name='counterparty-retrieve-update-destroy')
]