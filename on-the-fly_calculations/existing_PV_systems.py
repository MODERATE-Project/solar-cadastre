def compare_energy_generation(coordinates, tilt, azimuth, nominal_power, real_energy_last_year):
    # Calculate estimated generation from satellite data
    estimated_generation = calculate_estimated_generation(coordinates, tilt, azimuth, nominal_power)

    # Compare estimated generation with real energy generation from last year
    if real_energy_last_year < estimated_generation*0.9  or real_energy_last_year > estimated_generation*1.1:
        # Provide suggestions to the user based on the comparison
        suggestions = generate_suggestions(estimated_generation, real_energy_last_year)
        display_suggestions(suggestions)
    else:
        print("The system is performing well compared with expected data.")

# Function to calculate estimated energy generation from satellite data
def calculate_estimated_generation(coordinates, tilt, azimuth, nominal_power):
    # Use satellite data and solar radiation models to estimate generation
    # Return the estimated energy generation
    estimated_generation = call_PVGIS_API(coordinates, tilt, azimuth, nominal_power)
    return estimated_generation

# Function to generate suggestions based on the comparison
def generate_suggestions(estimated_generation, real_energy_last_year):
    # Compare estimated and real generation to identify the difference
    difference = (estimated_generation - real_energy_last_year)/real_energy_last_year

    # Generate suggestions based on the difference
    if difference < -0.2:
        return "Your system is underperforming. Consider checking for shading issues or equipment malfunctions."
	elif -0.2 < difference < 0.2:
        return "Your system performance are more or less in line with the expectetions. Some differences can occure due to annual variations. In any case, it is suggested to check if the performances of a clear sky day are in line with the expectections"
    else:
        return "Your system is overperforming. Confirm the accuracy of the input data and monitor for any anomalies."

# Function to display suggestions to the user
def display_suggestions(suggestions):
    # Display suggestions to the user
    print(suggestions)

# Example usage
# Replace the arguments with actual data
compare_energy_generation(coordinates, tilt, azimuth, nominal_power, real_energy_last_year)
