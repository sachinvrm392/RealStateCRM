from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import UserViewSet, agents_list

router = DefaultRouter()
router.register('', UserViewSet, basename='user')

urlpatterns = [
    path('agents/', agents_list, name='agents-list'),
    path('', include(router.urls)),
]
