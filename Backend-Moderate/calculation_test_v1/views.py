import requests
import math
from django.shortcuts import render, get_object_or_404
from django.template import loader
from django.http import HttpResponse
from django.views.decorators.csrf import csrf_exempt

from .models import Profile
from .forms import PotentialForm

#Hello world
def hello(request):
    template = loader.get_template('hello_template.html')
    return HttpResponse(template.render())


#Shows a list of profiles
#Passes a list containing all profiles to a template
def show_profiles(request):
    profiles = Profile.objects.all()
    context = { "profiles" : profiles }
    return render(request, "profile_list.html", context)


#Shows the profile info
#In an initial stage, shows the maximum value of the range of the profile
def profile_info(request, profile):
    profile_info = get_object_or_404(Profile, profile=profile)
    return HttpResponse(profile_info.max_value)


#Checks to which profile the user belongs
#If a consumption is not provided, a message is shown
#If the consumption is not in any range, the user is informed
def check_profile(consumption):
    if not consumption:
        raise Exception("You did not insert a consumption")
    else:
        #To be in the range, the consumption has been arbitrarily decided to be greater or equal
        #than the minimum value and estrictly lower than the maximum value
        profile = Profile.objects.filter(min_value__lte=consumption, max_value__gt=consumption)
        if profile:
            #The previous function returns a list. It should have a single element so the [0] could be omitted
            #but it is present to ensure a single profile is returned
            return profile[0]
        else:
            raise Exception("Your consumption does not match any profile")


#Takes user consumption, user profile and features from GeoServer
#Calls calculate_potential() with that parameters to get and return a numeric photovoltaic potential
#The comented lines are aimed to test the functionality without a form
@csrf_exempt
def get_potential(request):
    #return render(request, "form.html", {"form" : PotentialForm()})  To test the use of Django's Form class
    if request.method == "POST":
        try:
            consumption = int(request.POST["consumption"])
            lat = request.POST["lat"]
            lon = request.POST["long"]
            profile = check_profile(consumption)
            features = getGeoserverFeatures(lat, lon)
            potential = calculate_potential(profile, features, consumption)
            return render(request, "form.html", {"potential" : potential, "profile" : profile, "features" : features })
            # return HttpResponse(potential, status=200)
        except Exception as e:
            # return HttpResponse(e, status=400)
            #This code should execute when the consumption does not match any profile
            #or when the coordinates are wrong (are not in the zone for which we have information)
            return render(request, "form.html", {"error" : e })
    else:
        # return HttpResponse("Wrong method", status=405)
        return render(request, "form.html")
        

#Gets building features from GeoServer using its latitude and longitude
def getGeoserverFeatures(lat, long):
    url = "http://geoserver:8080/geoserver/GeoModerate/ows" #FIXME poner la url correcta
    headers = {
        "Accept": 'application/xml'
    }
    params = {
        "service" : "wfs",
        "vesrion" : "1.0.0",
        "request" : "getFeature",
        "typeName" : "GeoModerate:cadastral_buildings",
        "maxFeatures" : 50,
        "cql_filter" : f"INTERSECTS(geom, POINT({lat} {long}))",
        "outputFormat" : "application/json"
    }
    response = requests.get(url, headers=headers, params=params)
    if response.status_code == 200:
        try:
            return response.json()["features"][0]["properties"]
        except:
            raise Exception("Not valid coordinates")
    

#Calculates the potential of the building
##### NOT MEANINGFUL CALCULATION, JUST FOR DEVELOPING #####
def calculate_potential(profile, features, consumption):
    if consumption == "0":
        return 0
    a = features["area"] / float(consumption)
    return math.pow(a, 1/(profile.max_value - profile.min_value))
