from django.urls import path, include
from rest_framework_nested import routers
from .views import DealViewSet, PaymentMilestoneViewSet

router = routers.SimpleRouter()
router.register(r'', DealViewSet, basename='deal')

deals_router = routers.NestedSimpleRouter(router, r'', lookup='deal')
deals_router.register(r'milestones', PaymentMilestoneViewSet, basename='deal-milestones')

urlpatterns = [
    path('', include(router.urls)),
    path('', include(deals_router.urls)),
]
