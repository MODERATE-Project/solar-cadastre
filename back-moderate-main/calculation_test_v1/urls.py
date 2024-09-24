from django.urls import path
from . import views

app_name = "test_v1"
urlpatterns = [
    path('hello/', views.hello, name="hello"), #Hello world
    path("profiles/", views.show_profiles, name="show_profiles"), #Show a list of profiles
    path("profiles/<str:profile>", views.profile_info, name="profile_info"), #Show info about a profile
    path("form", views.get_potential, name="potential") #Determine the profile based on value inserted
]