from django.shortcuts import render
from django.http import HttpResponse, JsonResponse
from django.views.decorators.csrf import csrf_exempt, ensure_csrf_cookie
import json

from . import calcs_v3 as calcs

# Create your views here.

# Shows a form to input PV information and evaluate its performance
def show_form(request):
    '''
    Sends the CSRF cookie to the client.

    Args:
        Django's request object

    Returns:
        Nothing

    Note:
        This function is only used in order to send a GET request to the URL linked to this function
        and obtain in the response the CSRF cookie.
    '''
    return render(request, "system_evaluation.html")


# Method use to get the CSRF cookie
@ensure_csrf_cookie # For the response to send the CSRF Token as a Cookie in a header
def getCookie(request):
    '''
    Retrieves CSRF cookie from backend.

    Args:
        Django's request object

    Returns:
        Nothing

    Note:
        This function is only used in order to send a GET request to the URL linked to this function
        and obtain in the response the CSRF cookie.
    '''
    return HttpResponse("Get cookie")



def system_evaluation(request):
    '''
    Retrieves user input, calls a function to obtain and evaluation of a PV system and sends it to the user as a response

    Args:
        Django's request object

    Returns:
        JSONResponse containing the evaulation of the system or an HttpResponse with a message indicating that the POST
        method must be used if another one is received or that an error occurred.

    Note:
        This function retrieves from the user input a location based on latitude and longitude.
        The location indicates a building.
        Apart from that, it retrieves from the request (about the building) the roof tilt, the roof orientation,
        the nominal power of the PV and the real energy generation in last year.
        With that infomation, a function is called to calculate the evaluation. That function is in calcs.py
    '''
    if request.method == "POST":
        # Example data
        # coordinates = (38.24569231574074, -0.8062306401633923)
        # tilt = 30
        # azimuth = 0
        # nominal_power = 1.0
        # real_energy_last_year = 3000000

        coordinates = (request.POST["lat"], request.POST["lon"])
        tilt = request.POST["roof_tilt"]
        azimuth = request.POST["roof_orientation"]
        nominal_power = request.POST["nom_power"]
        real_energy_last_year = float(request.POST["real_last_year"])
        # month = request.POST["month"]

        result = calcs.compare_energy_generation(coordinates, tilt, azimuth, nominal_power, real_energy_last_year)

        if result:
            # return HttpResponse(suggestion)
            return JsonResponse(result)
        else:
            return HttpResponse("An error has occured", status=404)
    
    else:
        return HttpResponse("Use POST method", status=405)

