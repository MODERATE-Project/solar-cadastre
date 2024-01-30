from django.urls import path
from . import views

app_name = "exist_v1"
urlpatterns = [
    path('result', views.system_evaluation, name="evaluation"), # Evaluates how well a current PV system works
    path('form', views.show_form, name="form"), # Shows a form to input the PV system information
    path('getCookie', views.getCookie, name="getCookie") # Gets de CSRF token in a cookie value
]