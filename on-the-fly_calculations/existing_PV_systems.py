import requests
import pandas as pd
import matplotlib.pyplot as plt


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
                                      index_col=0, header=0, engine='python')
                                      
        pv_weather_data.index = pd.date_range('2019-01-01 00:00:00', '2019-12-31 23:00:00', freq='1H')

        #os.remove(pv_filename)
        print("PV data ready.")
        return pv_weather_data['P']
    
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
    estimated_generation = get_pv(coordinates[0], coordinates[1], tilt, azimuth, nominal_power)
    estimated_generation_sum = sum(estimated_generation)/1000
    print("\nEstimated yearly energy generation: {} kWh.".format(round(estimated_generation_sum,1)))
    # Compare estimated generation with real energy generation from last year
    if real_energy_last_year < estimated_generation_sum*0.9  or real_energy_last_year > estimated_generation_sum*1.1:
        # Provide suggestions to the user based on the comparison
        suggestions = generate_suggestions(estimated_generation_sum, real_energy_last_year)
        display_suggestions(suggestions)
    else:
        print("The system is performing well compared with expected data.")
    
    return estimated_generation


# Function to generate suggestions based on the comparison
def generate_suggestions(estimated_generation, real_energy_last_year):
    # Compare estimated and real generation to identify the difference
    difference = (real_energy_last_year-estimated_generation)/real_energy_last_year
    print("Difference between estimated and real data: {}%\n".format(round(difference*100,1)))

    # Generate suggestions based on the difference
    if difference < -0.2:
        return "Your system is underperforming. Consider checking for shading issues or equipment malfunctions."
    elif -0.2 < difference < 0.2:
        return "Your system performance are more or less in line with the expectetions. Some differences can occure due to annual variations. In any case, it is suggested to check if the performances of a clear sky day are in line with the expectections"
    else:
        return "Looks like your system is overperforming. Confirm the accuracy of the input data and monitor for any anomalies."

# Function to display suggestions to the user
def display_suggestions(suggestions):
    # Display suggestions to the user
    print(suggestions)

def get_month_number(month_name):
    month_names = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
    ]
    
    # Convert the month name to title case for case-insensitive matching
    month_name = month_name.title()
    
    # Check if the provided month name is valid
    if month_name in month_names:
        return month_names.index(month_name) + 1  # Adding 1 to convert from zero-based index to one-based index
    else:
        return None  # Return None for invalid month names







# Example usage
# Replace the arguments with actual data
coordinates = (45.014, 11.357)
tilt = 30
azimuth = 0    # deg (South=0, East=-90, 180=North, 90=West) 
nominal_power = 1    # kWp
real_energy_last_year = 1230.3  # kWh

PV_generation_profile = compare_energy_generation(coordinates, tilt, azimuth, nominal_power, real_energy_last_year)

print("\nLet's proceed with an additional test: monthly clearsky day comparison.\n")
PV_generation_daily_sum = PV_generation_profile.resample('D').sum()/1000

def find_highest_energy_day(energy_data):
    # Initialize a dictionary to store the highest energy day for each month
    highest_energy_days = {}

    # Iterate through each month in the energy data
    for month, daily_energy in energy_data.groupby(energy_data.index.month):
        # Find the date with the highest energy in the month
        highest_day = daily_energy.idxmax()
        # Store the result in the dictionary
        highest_energy_days[month] = {
            'day': highest_day.day,
            'energy': daily_energy[highest_day]
        }
        

    return highest_energy_days

# Call the function to find the highest energy day for each month
result = find_highest_energy_day(PV_generation_daily_sum)

# Plot only the highest energy day for each month
plot_title = 'Hourly energy production profiles for highest energy days'
plt.figure(figsize=(12, 6))
for month, data in result.items():
    highest_day_index = (PV_generation_profile.index.month == month) & (PV_generation_profile.index.day == data['day'])
    highest_day_profile = PV_generation_profile[highest_day_index]
    plt.plot(highest_day_profile.index.hour, highest_day_profile.values, label=f"Month {month}, Day {data['day']}")

plt.title(plot_title)
plt.xlabel('Hour of Day')
plt.ylabel('Energy Production')
plt.legend()
plt.show()

print("1) Select the month you want to use for comparison.")
month_name = 'February'
month = get_month_number(month_name)
print("Selected month is {}".format(month_name))
day = result[month]['day']
print("2) For the selected month, highest energy generation is {} kWh\n".format(result[month]['energy']))

plot_title = 'Hourly energy production profiles for highest energy day of the selected month'
plt.figure(figsize=(12, 6))
highest_day_index = (PV_generation_profile.index.month == month) & (PV_generation_profile.index.day == data['day'])
highest_day_profile = PV_generation_profile[highest_day_index]
plt.plot(highest_day_profile.index.hour, highest_day_profile.values, label=f"Month {month}, Day {data['day']}")

print("3) From your PV system monitoring app compare the daily generation and the shape of the generation profile.\n")
print("4) Are them similar to the ones shown?\n")
answer = False

if answer == True:
    print("Looks like your system is performing well. Try to repeat this check monthly. If the monthly generation is very different with respect to the one expected, consider to search more in detail for the source of error.")
elif answer == False:
    print("The shown curve represents the hourly generation of the highest generation day for your location. Compare it with the data of your monitoring app.")
    print("If the curves are different you may have one of the following issues:")
    print("    - close shading")    # show example hourly generation curve
    print("    - far shading (e.g. mountains)")    # show example hourly generation curve
    print("    - soiling")    # show example hourly generation curve
    print("    - modules broken/disconnected")    # show example hourly generation curve
    print("    - overheating")    # show example hourly generation curve
    print("    - snow")    # show example hourly generation curve
    print("    - inverter failure")    # show example hourly generation curve


    













