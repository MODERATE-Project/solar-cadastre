from django.urls import path
from . import views

app_name = "test_v2"
urlpatterns = [
    path('potential/form', views.form, name="form"), # URL to see the test form
    path('getCookie', views.getCookie, name="getCookie"), # URL to get the CSRF cookie
    path('potential/result', views.result, name="result"), # URL to calculate the KPIs with user inputs

]