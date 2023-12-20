from django import forms 

#Alternative to use an HTML template
#This code automatically generates a form

class PotentialForm(forms.Form):
    consumption = forms.FloatField(label="Consumption", required=True, min_value=0)
    lat = forms.FloatField(label="Latitude", required=True)
    long = forms.FloatField(label="Longitude", required=True)