from django.urls import path, include
from rest_framework_nested import routers
from .views import LeadViewSet, CallAttemptViewSet

router = routers.SimpleRouter()
router.register(r'', LeadViewSet, basename='lead')

leads_router = routers.NestedSimpleRouter(router, r'', lookup='lead')
leads_router.register(r'calls', CallAttemptViewSet, basename='lead-calls')

urlpatterns = [
    path('', include(router.urls)),
    path('', include(leads_router.urls)),
]
