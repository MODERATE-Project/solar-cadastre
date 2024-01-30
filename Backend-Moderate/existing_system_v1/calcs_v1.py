import requests
import pandas as pd
import datetime as dt
import os
import numpy


def call_PVGIS_API(coordinates, tilt, azimuth, peak_power):
    '''
    Retrieves photovoltaic (PV) system data using the PVGIS API.

    Args:
        lat (float): Latitude of the location.
        long (float): Longitude of the location.
        tilt (float): Tilt angle of the PV system in degrees.
        azimuth (float): Azimuth angle of the PV system in degrees.
        peak_power (float): Nominal power of the PV system in kilowatts.

    Returns:
        numpy.ndarray or None: Hourly PV power generation data.
            Returns None in case of API request failure.

    Raises:
        requests.exceptions.HTTPError: If an HTTP error occurs during the API request.
        requests.exceptions.RequestException: If a general request error occurs.

    Note:
        This function makes an API request to the PVGIS service to obtain hourly
        photovoltaic power generation data based on the provided parameters.
        The returned data is in the form of a NumPy array.
    '''
    lat = coordinates[0]
    lon = coordinates[1]
    losses = 14
    year = 2019
    url = 'https://re.jrc.ec.europa.eu/api/v5_2/seriescalc?lat=' + str(lat) + '&lon=' + str(
        lon) + '&startyear=' + str(year)+ '&endyear=' + str(year) + '&pvcalculation=' + str(1) + '&peakpower=' + str(peak_power) + '&loss=' + str(losses) + '&angle=' + str(
        tilt) + '&aspect=' + str(azimuth) + '&outputformat=csv&browser=1'
    print("Ready to get the PV data.")
    
    try:
        r = requests.get(url, allow_redirects=True)
        print("PVGIS request done.")
        #pv_filename = r.headers['Content-disposition'].split('filename=')[1]

        pv_filename = 'PV data.csv'
        with open(pv_filename, 'wb') as pv_file:
          pv_file.write(r.content)

        print("Downloaded PV data.")

        pv_header_no_of_rows = 10
        pv_footer_no_of_rows = 10


        pv_weather_data = pd.read_csv(pv_filename, skiprows=pv_header_no_of_rows, skipfooter=pv_footer_no_of_rows,
                                      index_col=0, header=0)
                                      

        #os.remove(pv_filename)
        print("PV data ready.") 
        
        hours = pv_weather_data.index[:24] # Get hours

        generation = []

        for i in range(24):
            generation.append({"name" : hours[i].split(":")[1][:2], "value" : pv_weather_data['P'].values[i]})

        return sum(pv_weather_data['P'].values), generation
    
    except requests.exceptions.HTTPError as errh:
        print("HTTP Error:", errh)
        return None

    except requests.exceptions.RequestException as err:
        print("Error:", err)
        return None
    except:
        print("Error! Try a different location. If the error persists, contact us.")
        return None


def compare_energy_generation(coordinates, tilt, azimuth, nominal_power, real_energy_last_year):
    # Calculate estimated generation from satellite data
    estimated_generation, daily_generation = calculate_estimated_generation(coordinates, tilt, azimuth, nominal_power)

    # Compare estimated generation with real energy generation from last year
    if real_energy_last_year < estimated_generation * 0.9  or real_energy_last_year > estimated_generation * 1.1:
        # Provide suggestions to the user based on the comparison
        suggestions = generate_suggestions(estimated_generation, real_energy_last_year)
        return suggestions, daily_generation
    else:
        return "The system is performing well compared with expected data.", daily_generation


# Function to calculate estimated energy generation from satellite data
def calculate_estimated_generation(coordinates, tilt, azimuth, nominal_power):
    # Use satellite data and solar radiation models to estimate generation
    # Return the estimated energy generation
    estimated_generation, daily_generation = call_PVGIS_API(coordinates, tilt, azimuth, nominal_power)
    return estimated_generation, daily_generation


# Function to generate suggestions based on the comparison
def generate_suggestions(estimated_generation, real_energy_last_year):
    # Compare estimated and real generation to identify the difference
    difference = (estimated_generation - real_energy_last_year) / real_energy_last_year

    # Generate suggestions based on the difference
    if difference < -0.2:
        return "Your system is underperforming. Consider checking for shading issues or equipment malfunctions."
    elif -0.2 < difference < 0.2:
        return "Your system performance are more or less in line with the expectetions. Some differences can occure due to annual \
                variations. In any case, it is suggested to check if the performances of a clear sky day are in line with the expectections."
    else:
        return "Your system is overperforming. Confirm the accuracy of the input data and monitor for any anomalies."


# Function to display suggestions to the user
def display_suggestions(suggestions):
    # Display suggestions to the user
    print(suggestions)