from django.shortcuts import render
from django.http import HttpResponse, JsonResponse
from django.views.decorators.csrf import csrf_exempt, ensure_csrf_cookie

from . import calcs
from pyproj import Transformer
import requests

# Create your views here.

def form(request):
    '''
    Shows a test form to input information and obtain KPIs about photovoltaic generation

    Args:
        Django's request object

    Returns:
        Nothing

    Note:
        When visiting the URL linked to this function, the form is rendered using the contents of form_v2.html.
        The form asks for:
            - Latitude
            - Longitude
            - Roof tilt
            - Roof orientation
            - Nominal power
            - Yearly consumption
            - Electricity cost
            - Value of sold electricity
            - PV cost
    '''
    return render(request, "form_v2.html")


#Gets building features from GeoServer using its latitude and longitude
def getGeoserverFeatures(lat, lon):
    '''
    Retrieves building features using the GeoServer data.

    Args:
        lat (float): Latitude of the location.
        lon (float): Longitude of the location.

    Returns:
        list: List of features of the building, such as its type or convinient area for PV

    Raises:
        ValueError if coordinates are not valid or there is no information in the server for that location.
        requests.exceptions.RequestException: If a general request error occurs.
    '''

    url = "http://80.211.131.194:8080/geoserver/GeoModerate/ows"
    headers = {
        "Accept": 'application/xml'
    }
    params = {
        "service" : "wfs",
        "vesrion" : "1.0.0",
        "request" : "getFeature",
        "typeName" : "GeoModerate:cadastral_buildings",
        "maxFeatures" : 50,
        "cql_filter" : f"INTERSECTS(geom, POINT({lat} {lon}))",
        "outputFormat" : "application/json"
    }
    response = requests.get(url, headers=headers, params=params)
    if response.status_code == 200:
        try:
            return response.json()["features"][0]["properties"]
        except:
            raise ValueError("Not valid coordinates")


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


#Calculates the photovoltaic potential with a set of inputs
# @csrf_exempt //Disable CSRF protection
def result(request):
    '''
    Retrieves user input, calls a function to obtain KPIs and sends them to the user as a response

    Args:
        Django's request object

    Returns:
        JSON Object: JSON containing the KPIs and their values.
        HTTP Response: If the method of the request is not POST, a message is returned as a response 
                       indicating that the method used to obtain the KPIs must be POST.

    Raises:
        Generic Exception if the result object containg KPIs is None instead of containing the required information.
        requests.exceptions.RequestException: If a general request error occurs.

    Note:
        This function retrieves from the user input a location based on latitude and longitude.
        The location indicates a building.
        Apart from that, it retrieves from the request (about the building) the roof tilt, the roof orientation,
        the nominal power of the PV,  the yearly electrical consumption, the cost of electricity,
        the value of sold electricity and the cost of the PV. Moreover, the function retrieves from
        GeoServer the building usage and its yearly PV generation (currently it is fixed to an example value
        as that information is not available).
        With that infomation, a function is called to calculate the KPIs. That function is in calcs.py
    '''
    
    # Example usage for non-existing buildings
    if request.method == "POST":
        ''' Code used for testing. It prints the request headers '''
        # headers = request.META
        # for key, value in headers.items():
        #     print(f"{key}: {value}")


        # Coordinates
        latitude = request.POST["lat"]   # From click
        longitude = request.POST["lon"]  # From click
        building_coordinates = (latitude, longitude)

        # Data from form
        roof_tilt = request.POST["roof_tilt"]
        roof_orientation = request.POST["roof_orientation"]
        pv_nominal_power = float(request.POST["nom_power"])
        yearly_consumption = float(request.POST["yearly_consumption"])   
        cost_of_electricity = float(request.POST["electricity_cost"])  
        value_of_sold_electricity = float(request.POST["value_sold_electricity"])
        cost_of_PV = float(request.POST["pv_cost"])

        # Transform coordinates to EPSG:25830 reference system, used by GeoServer
        transformer = Transformer.from_crs("EPSG:4326", "EPSG:25830")
        x_coord, y_coord = transformer.transform(latitude, longitude)

        # Retrieve features from GeoServer
        features = getGeoserverFeatures(x_coord, y_coord);

        # Needed features from GeoServer
        yearly_pv_generation_per_kWp = float(features["average_yi"])   # GeoServer
        yearly_pv_generation_per_kWp = 1200 # EXAMPLE. Data not available in GeoServer
        yearly_pv_generation = yearly_pv_generation_per_kWp * pv_nominal_power
        consumption_type = features["building_u"]   # GeoServer Default: residential

        # Example data
        # latitude = 46.1
        # longitude = 11.1
        # roof_tilt = 30
        # building_coordinates = (latitude, longitude)  # Replace with coordinates from the map
        # pv_nominal_power = 1  # User input (to be validated with area available from pre-processed data)
        # roof_tilt = 30  # User input
        # roof_orientation = 0  # User input
        # consumption_type = 'residential'  # Dropdown selection
        # yearly_consumption = 5000  # kWh User input
        # yearly_pv_generation_per_kWp = 1200  # Average energy yield (from pre-processed data)
        # yearly_pv_generation = yearly_pv_generation_per_kWp*pv_nominal_power
        # cost_of_electricity = 0.3  # €/kWh User input with default values already set
        # value_of_sold_electricity = 0.1  # €/kWh User input with default values already set
        # cost_of_PV = 2000   # €/kWp  User input with default values already set

        # KPI calculation 
        print('Techno-economic calculation...\n')
        analysis_results = calcs.techno_economic_analysis(
            building_coordinates, pv_nominal_power, roof_tilt, roof_orientation, consumption_type, yearly_consumption, yearly_pv_generation, cost_of_electricity, value_of_sold_electricity, cost_of_PV
        )

        if analysis_results is not None:
            return JsonResponse(analysis_results)
            # return render(request, "calc_result.html", {"results" : analysis_results})
        else:
            raise Exception("Error. Not valid result")
    
    else:
        return HttpResponse("Use POST method to send the form", status=405)
