#!/usr/bin/env python
# coding: utf-8

# In[116]:


import pandas as pd
import numpy
import datetime as dt
import requests
import random
import os

def get_pv(lat, long, tilt, azimuth, peak_power):
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
    losses = 14
    year = 2019
    url = 'https://re.jrc.ec.europa.eu/api/v5_2/seriescalc?lat=' + str(lat) + '&lon=' + str(
        long) + '&startyear=' + str(year)+ '&endyear=' + str(year) + '&pvcalculation=' + str(1) + '&peakpower=' + str(peak_power) + '&loss=' + str(losses) + '&angle=' + str(
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
        return pv_weather_data['P'].values
    
    except requests.exceptions.HTTPError as errh:
        print("HTTP Error:", errh)
        return None

    except requests.exceptions.RequestException as err:
        print("Error:", err)
        return None
    except:
      print("Error! Try a different location. If the error persists, contact us.")
      return None
      

def get_consumption_profile_from_database(cons_type):
    # to be get right column from database
    df = pd.read_csv('Consumption_profiles/DBprofiles.csv', index_col ='Time')*1000
    cons = df[cons_type].values
    return cons

def get_self_consumption_profile(consumption_profile, generation_profile):
    """
    Calculate element-wise self-consumed energy and sold energy.

    Parameters:
    - consumption_profile: List of energy consumption values.
    - generation_profile: List of energy generation values.

    Returns:
    - Tuple containing two lists:
      1. List of element-wise self-consumed energy values.
      2. List of element-wise sold energy values.
    """
    # Ensure the input lists have the same length
    if len(consumption_profile) != len(generation_profile):
        raise ValueError("Input lists must have the same length.")

    # Initialize empty lists to store self-consumed and sold energy values
    self_consumed_energy = []
    sold_energy = []

    # Calculate self-consumed and sold energy element-wise
    for consumption, generation in zip(consumption_profile, generation_profile):
        self_consumed = min(consumption, generation)
        self_consumed_energy.append(self_consumed)
        sold_energy.append(max(0, generation - consumption))

    return self_consumed_energy, sold_energy

def calculate_roi(initial_investment, yearly_earnings):
    """
    Calculate the return on investment (ROI) for a scenario with yearly earnings.

    Parameters:
    - initial_investment: Initial investment amount.
    - yearly_earnings: List of yearly earnings.

    Returns:
    - Return on investment (ROI) as a percentage.
    """
    if initial_investment < 0 or any(earning < 0 for earning in yearly_earnings):
        raise ValueError("Investment and earnings must be non-negative values.")

    total_earnings = sum(yearly_earnings)
    roi = ((total_earnings - initial_investment) / initial_investment) * 100
    return roi

def techno_economic_analysis(lat_lon, nominal_power, roof_tilt, roof_orientation, consumption_type, yearly_consumption, yearly_pv_generation, cost_of_electricity, value_of_sold_electricity, cost_of_PV):
    # Perform calculations based on the inputs
    yearly_maintenance = 30   # €/kWp
    time_horizon = 25   # years
    yearly_maintenance =  nominal_power*yearly_maintenance

    generation_profile = get_pv(lat_lon[0], lat_lon[1], roof_tilt, roof_orientation, nominal_power)
    
    if isinstance(generation_profile, numpy.ndarray):

        rescaled_generation_profile = generation_profile*yearly_pv_generation/sum(generation_profile)
        consumption_profile = get_consumption_profile_from_database(consumption_type)
        rescaled_consumption_profile = [i * yearly_consumption/sum(consumption_profile) for i in consumption_profile]

        self_consumption_profile, sold_energy_profile = get_self_consumption_profile(rescaled_consumption_profile, rescaled_generation_profile)

        yearly_savings = sum(self_consumption_profile) * cost_of_electricity
        yearly_earnings_sold =  sum(sold_energy_profile) * value_of_sold_electricity
        self_consumption = sum(self_consumption_profile)/sum(rescaled_generation_profile)
        self_sufficiency = sum(self_consumption_profile)/sum(rescaled_consumption_profile)
        yearly_generation = sum(rescaled_generation_profile)
        initial_investment = nominal_power*cost_of_PV
        
        # calculate the yearly savigs of the PV system summing savigns, earnings ad subtracting the yearly maintenance
        yearly_earnings = yearly_savings+yearly_earnings_sold-yearly_maintenance

        #roi = get_roi(self_consumption_profile, sold_energy_profile, cost_of_electricity, value_of_sold_electricity)
        roi = calculate_roi(initial_investment, [yearly_earnings]*time_horizon)

        # Create a dictionary with the calculated indicators
        results = {
          'self_consumption [%]': self_consumption*100,
          'self_sufficiency [%]': self_sufficiency*100,
          'yearly_generation [kWh]': yearly_generation,
          'yearly_savings [€]': yearly_savings,
          'yearly_earnings_sold [€]': yearly_earnings_sold,
          'total_yearly_earnings [€]': yearly_earnings,
          'roi [%]': roi
        }
        
        df_monthly_data = pd.DataFrame()
        df_monthly_data['PV [kWh]'] = rescaled_generation_profile
        df_monthly_data['Consumption [kWh]'] = rescaled_generation_profile
        df_monthly_data['Self-consumption [kWh]'] = self_consumption_profile
        df_monthly_data['Sold energy [kWh]'] = sold_energy_profile
        year=2023
        df_monthly_data.index = pd.date_range(start=f'{year}-01-01', end=f'{year}-12-31 23:00:00', freq='H')
        
        return results, df_monthly_data
    else:
        return

# Example usage for non-existing systems

# INPUTS from the map
latitude = 47.114
longitude =  9.111
building_coordinates = (latitude, longitude)  # Replace with coordinates from the map
yearly_pv_generation_per_kWp = 1200  # Average energy yield (from pre-processed data)

# User inputs
pv_nominal_power = 3  # User input (to be validated with area available from pre-processed data)
roof_tilt = 30  # User input
roof_orientation = 0  # User input
consumption_type = 'Residential 1'  # Dropdown selection
yearly_consumption = 2700  # kWh User input

cost_of_electricity = 0.3  # €/kWh User input with default values already set
value_of_sold_electricity = 0.1  # €/kWh User input with default values already set
cost_of_PV = 2000   # €/kWp  User input with default values already set


print('Techno-economic calculation...\n')
yearly_pv_generation = yearly_pv_generation_per_kWp*pv_nominal_power

analysis_results, monthly_df = techno_economic_analysis(
    building_coordinates, pv_nominal_power, roof_tilt, roof_orientation, consumption_type, yearly_consumption, yearly_pv_generation, cost_of_electricity, value_of_sold_electricity, cost_of_PV
	)

# Print the results
if analysis_results != None:
  print('Results:')
  for key, value in analysis_results.items():
      print(f'{key}: {round(value,2)}')
else:
  print('Some error occurred!')


monthly_df.plot.bar()





















