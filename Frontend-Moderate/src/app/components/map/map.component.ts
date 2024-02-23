import { Component, OnInit, Renderer2 } from '@angular/core';
import * as L from 'leaflet';
import * as esri_geo from 'esri-leaflet-geocoder';
import * as esri from 'esri-leaflet'
import axios from 'axios';
import { BuildingsService } from 'src/app/services/buildings.service';
import 'proj4leaflet';
import { schemeCategory10 } from 'd3-scale-chromatic';
import * as d3 from 'd3'; 


@Component({
  selector: 'app-map',
  templateUrl: './map.component.html',
  styleUrls: ['./map.component.scss']
})

export class MapComponent implements OnInit {
  private marker: L.Marker | null = null;
  private map;

  private geoserverURL = "http://80.211.131.194:8080/";
  private pvGenerationCells = "http://80.211.131.194:8080/geoserver/GeoModerate/wms?";

  private buildingCadastral = "http://80.211.131.194:8080/geoserver/GeoModerate/wms?"

  point: any;

  WMS_CADASTRE = 'https://ovc.catastro.meh.es/Cartografia/WMS/ServidorWMS.aspx?';
  properties: any[];

  // Chart options for all charts
  view: [number, number] = [550, 300];
  legend: boolean = false;
  showLabels: boolean = true;
  animations: boolean = true;
  xAxis: boolean = true;
  yAxis: boolean = true;
  showYAxisLabel: boolean = true;
  showXAxisLabel: boolean = true;
  showGridLines: boolean = true;
  // colorScheme = {
  //   domain: [...schemeCategory10, '#FFA07A', '#6A5ACD']
  // } as any;
  colorScheme = {
    domain: ['#6A5ACD']
  } as any;
  customColors = [
    {
      name: 'Actual',
      value: '#ff8000'
    }
  ];
  gradient: boolean = true

  // Line chart axes and data
  xAxisLabelLine: string = 'Hour of Day';
  yAxisLabelLine: string = 'Energy Production [kWh]';
  chartDataLine: any[];

  // Bar chart about yearly generation axes and data
  xAxisLabelBarYear: string = 'Year';
  yAxisLabelBarYear: string = 'Energy Production [kWh]';
  chartDataBarYear: any[];

  // Bar chart about monthly generation axes and data
  xAxisLabelBarMonth: string = 'Month';
  yAxisLabelBarMonth: string = 'Energy Production [kWh]';
  chartDataBarMonth: any[];

  // url_server = "80.211.131.194";
  url_server = "localhost";

  constructor(private renderer: Renderer2, private buildingServices: BuildingsService) { }

  //Get cookie value, indicating the name of the cookie
  getCookie(name) {
    let cookieValue = null;
    if (document.cookie && document.cookie !== '') {
        const cookies = document.cookie.split(';');
        for (let i = 0; i < cookies.length; i++) {
            const cookie = cookies[i].trim();
            if (cookie.substring(0, name.length + 1) === (name + '=')) {
                cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                break;
            }
        }
    }
    return cookieValue;
  }

  ngOnInit(): void {
    this.initMap();
  }

  initMap(){
    //[38.2462, -0.8073], 13 crevillente
    //[51.505, 10], 5 ue

     // Reference system EPSG:25830 to get info from cadastre Spain
     const crs25830 = new L.Proj.CRS('EPSG:25830',
     '+proj=utm +zone=30 +ellps=GRS80 +units=m +no_defs',
     {
       resolutions: [2048, 1024, 512, 256, 128, 64, 32, 16, 8, 4, 2, 1, 0.5],
       origin: [0, 0]
     });

    this.map = L.map('map').setView([38.2462, -0.8073], 16);
    console.log(this.map)
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors'
    }).addTo(this.map);

    const customIcon = L.icon({
      iconUrl: '../../../assets/img/icons/location_icon.svg',
      iconSize: [25, 41],
      iconAnchor: [12, 41],
      className: 'custom-marker-icon'
    });

    // Añadir capas de mapas
    const openStreetMapLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors'
    });
    const topographicLayer = L.tileLayer('https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenTopoMap contributors'
    });
    const streetsLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors'
    });

    // Definir el control de capas
    const baseMaps = {
      "OpenStreetMap": openStreetMapLayer,
      "Topographic": topographicLayer,
      "Streets": esri.basemapLayer('Streets'),
    };

    const cadastreLayer = L.tileLayer.wms(this.WMS_CADASTRE, {
      format: 'image/png',
      transparent: true,
      layers: 'Catastro',
      tileSize: 2080,
    });

    const buildingPVGeneration = L.tileLayer.wms(this.pvGenerationCells, {
      format: 'image/png',
      transparent: true,
      layers: 'GeoModerate:PV generation convinient cells',
      tileSize: 2080,
    });

    const buildingCadastralLayer = L.tileLayer.wms(this.buildingCadastral, {
      format: 'image/png',
      transparent: true,
      layers: 'GeoModerate:cadastral_buildings',
      tileSize: 3080,
      crs: crs25830
    });

    const overlayMaps = {
      "PV generation convinient cells": buildingPVGeneration,
      "Cadastral buildings": buildingCadastralLayer,
      "Cadastre": cadastreLayer,
    };


    L.control.layers(baseMaps, overlayMaps).addTo(this.map);

    

    this.map.on('click', async (event) => {
      if (this.marker) {
        this.marker.setLatLng(event.latlng);
      } else {
        this.marker = L.marker(event.latlng, { icon: customIcon }).addTo(this.map);
      }

      const latLng = event.latlng;

      this.point = crs25830.project(event.latlng);

      const geocodeService = esri_geo.geocodeService();
      this.properties = [];
      let address = '';

      geocodeService.reverse().latlng(event.latlng).run((error, result) => {
        if (error) {
          return;
        }
        address = result.address.Address;
      });

      /*const popup = L.popup()
        .setLatLng(latLng)
        .setContent('You click in this position')
        .openOn(this.map)*/
      // Puedes realizar cualquier acción adicional con las coordenadas del clic aquí

      let buildingInfo;

      this.buildingServices.getBuildingsFeature(this.point.x, this.point.y).then((data)=> {
        buildingInfo = JSON.parse(data).features[0].properties;
        console.log(buildingInfo);
      })

      const nominatimResponse = await axios.get('https://nominatim.openstreetmap.org/reverse', {
          params: {
            lat: latLng.lat,
            lon: latLng.lng,
            format: 'json'
          }
      });

      axios.get(`https://geocode.arcgis.com/arcgis/rest/services/World/GeocodeServer/reverseGeocode`, {
        params: {
          location: `${latLng.lng},${latLng.lat}`,
          f: 'json',
          token: 'AAPK5405a7c87b1840238d0451576f7a4c56siHssPxZJRvP5MpPtAVXxjyJcvyuhicuES_NHhvk2J-TRG_COpGkw91f17oH7vQY'
        }
      })
        .then((response) => {
          console.log(response)
          const streetName = response.data.address.Address;
          const useBuilding = nominatimResponse.data.type;
          // const useBuilding = "residential"

          // Delete previous forms, results and charts
          const calculation_div = document.querySelector("div#calculation");
          this.renderer.setProperty(calculation_div, 'innerHTML', '');
          document.getElementById("chart").style.display = "none";
          
          // Actualizar el contenido del div con los datos, incluyendo el nombre de la calle
          const datosContainer = document.getElementById('tablas');
          this.renderer.setProperty(datosContainer, 'innerHTML', `
            <h2>${streetName}</h2>
            <br>
            <h3>Building information</h3>
            <table style="background-color: #FAFAFA; border: 1px solid black;">
              <tr rowspan="2">
                <td style="background-color: #004470; color: white;">Area</td>
                <td style="background-color: #2c6488; color: white;">${buildingInfo.area.toFixed(4)} m<sup>2</sup></td>
              </tr>
              <tr>
                <td style="background-color: #004470; color: white;">Building use</td>
                <td style="background-color: #2c6488; color: white;">${useBuilding}</td>
              </tr>
              <tr>
                <td style="background-color: #004470; color: white;">Year of construction</td>
                <td style="background-color: #2c6488; color: white;">${buildingInfo.year_const}</td>
              </tr>
              <tr>
                <td style="background-color: #004470; color: white;">Floors</td>
                <td style="background-color: #2c6488; color: white;">${buildingInfo.floors}</td>
              </tr>
              <tr>
                <td style="background-color: #004470; color: white;">Thermal needs</td>
                <td style="background-color: #2c6488; color: white;">${buildingInfo.thermal_ne}</td>
              </tr>
              <tr>
                <td style="background-color: #004470; color: white;">Area convinenient for PV</td>
                <td style="background-color: #2c6488; color: white;">${buildingInfo.area_convi} m<sup>2</sup></td>
              </tr>
              <tr>
                <td style="background-color: #004470; color: white;">PV nominal power convinenient surface</td>
                <td style="background-color: #2c6488; color: white;">${buildingInfo.pv_nominal} kWp</td>
              </tr>
              <tr>
                <td style="background-color: #004470; color: white;">Potential PV energy</td>
                <td style="background-color: #2c6488; color: white;">${buildingInfo.potential_} kWh/year</td>
              </tr>
              <tr>
                <td style="background-color: #004470; color: white;">Average yield</td>
                <td style="background-color: #2c6488; color: white;">${buildingInfo.average_yi} kWh/kWp</td>
              </tr>
              <tr>
                <td style="background-color: #004470; color: white;">Potential CO<sub>2</sub> emission reduction</td>
                <td style="background-color: #2c6488; color: white;">${buildingInfo.potentialc} kgCO<sub>2</sub></td>
              </tr>
            </table>
            <br>
            <h3>Raster information</h3>
            <table style="border: 1px solid black;">
              <tr>
                <td style="background-color: #0B610B; color: white;">Solar irradiance</td>
                <td style="background-color: #548235; color: white;">${buildingInfo.solar_irra} kWh/m<sup>2</sup></td>
              </tr>
              <tr>
                <td style="background-color: #0B610B; color: white;">PV generation</td>
                <td style="background-color: #548235; color: white;">${buildingInfo.pv_generat} kWh/m<sup>2</sup></td>
              </tr>
            </table>
            <br>
            <h3>Selected area information</h3>
            <table style="border: 1px solid black;">
              <tr>
                <td style="background-color: #B45F04; color: white;">Sum of area convinient for PV</td>
                <td style="background-color: #DF7401; color: white;">${buildingInfo.solar_irra} m<sup>2</sup></td>
              </tr>
              <tr>
                <td style="background-color: #B45F04; color: white;">Sum of PV nominal power convinient for PV</td>
                <td style="background-color: #DF7401; color: white;">${buildingInfo.pv_generat} kWp</td>
              </tr>
              <tr>
                <td style="background-color: #B45F04; color: white;">Sum of potential PV energy</td>
                <td style="background-color: #DF7401; color: white;">${buildingInfo.potentialp} kWh/year</td>
              </tr>
              <tr>
                <td style="background-color: #B45F04; color: white;">Average yield</td>
                <td style="background-color: #DF7401; color: white;">${buildingInfo.average_yi} kWh/kWp</td>
              </tr>
              <tr>
                <td style="background-color: #B45F04; color: white;">Sum of potential CO<sub>2</sub> emission reduction</td>
                <td style="background-color: #DF7401; color: white;">${buildingInfo.pv_generat} kgCO<sub>2</sub></td>
              </tr>
            </table>

            <br>
            `
          );
        })
        .then(async() => {
          console.log(latLng);
          document.getElementById("buttons").style.display = "block";
          let btnPotential = document.querySelector("button#showPotential"); // Button to show potential form
          let btnEvaluation = document.querySelector("button#showEvaluation"); // Button to show evaluation form
          let calcDiv = document.querySelector("div#calculation"); // Container where forms and results are shown
          
          // Solar potential
          btnPotential.addEventListener("click", async() => {
            document.getElementById("chart").style.display = "none";
            // Show potential form
            calcDiv.innerHTML = `

              <h3>Potential calculation</h3>
              
              <form method="POST" action='http://${this.url_server}:8000/potential/v2/result' id="potentialMainForm">

                <label for="roof_tilt">Roof tilt: </label>
                <input style="margin: 5px 0; width: 120px" type="number" step="any" min="0" name="roof_tilt" required><br/>

                <label for="roof_orientation">Roof orientation: </label>
                <input style="margin: 5px 0; width: 120px" type="number" step="any" name="roof_orientation" required><br/>

                <label for="nom_power">Nominal power [kWp]: </label>
                <input style="margin: 5px 0; width: 120px" type="number" step="any" min="0" name="nom_power" required><br/>
                
                <label for="yearly_consumption">Yearly consumption [kWh]: </label>
                <input style="margin: 5px 0; width: 120px" type="number" step="any" min="0" name="yearly_consumption" required><br/>

                <label for="electricity_cost">Electricity cost [€/kWh]: </label>
                <input style="margin: 5px 0; width: 120px" type="number" step="0.01" min="0" name="electricity_cost"><br/>

                <label for="value_sold_electricity">Value of sold electricity [€/kWh]: </label>
                <input style="margin: 5px 0; width: 120px" type="number" step="0.01" min="0" name="value_sold_electricity" required><br/>

                <label for="pv_cost">PV cost [€/kWp]: </label>
                <input style="margin: 5px 0; width: 120px" type="number" step="0.01" min="0" name="pv_cost" required><br/>

                <label for="profile">Profile: </label>
                <select name="profile" style="margin: 5px 10px" required>
                </select><br/>

                <input style="margin: 5px 0" type="submit" value="Calculate">
                <input style="margin: 5px 0" type="reset" value="Reset">

              </form>
            `;
            let form = document.querySelector("form#potentialMainForm") as HTMLFormElement;

             // Get profile names from database
            const responseProfiles = await fetch(`http://${this.url_server}:8000/potential/v2/getProfiles`, { method: "GET" });
            const resultProfiles = await responseProfiles.json();
            const profiles = resultProfiles.profiles;

            const selectProfile = form.querySelector("select"); // Select element of form

            // Add profiles to dropdown (select element)
            for (let profile of profiles) {
              let optionNode = document.createElement("option");
              optionNode.setAttribute("value", profile);
              optionNode.textContent = profile;
              selectProfile.appendChild(optionNode);
            }

            form.addEventListener("submit", async(event) => { // Actions to perform when submitting the form
              event.preventDefault(); // Prevent the form redirecting to another page
              const url = form.action; // Save in url variable the value of action attribute of the form
              const formData = new FormData(form); // Create an object containing the data inserted in the form
              formData.append("lat", latLng.lat); // Append to the formData object the latitude of the click
              formData.append("lon", latLng.lng); // Append to the formData object the longitude of the click
              await fetch(`http://${this.url_server}:8000/potential/v2/getCookie`, { method: "GET", credentials: "include" }); // Get the CSRF cookie from backend
              form.style.display = "none";  // Hide form
              const message = document.querySelector("#calculation h3");
              message.textContent = "Processing..."; // Change text to indicate that the processing of data is being made
              const headers = new Headers(); // Create an object to contain the headers of the request to server
              headers.append('X-CSRFToken', this.getCookie("csrftoken")) // Append the CSRF cookie to the headers object
              fetch(url, { method: "POST", headers: headers, body: formData, credentials: "include" }) // Obtain the KPIs from server with data inserted in the form
                .then(async(response) => {
                  const data = await response.json();
                  const table = document.createElement("table");
                  table.setAttribute("style", "border: 1px solid; width: 100%");

                  // Create table with results
                  for (const key in data) { 
                    const tr = document.createElement("tr");
                    const tdKey = document.createElement("td");
                    const tdValue = document.createElement("td");
                    tdKey.textContent = key;
                    tdValue.textContent = data[key].toFixed(2);
                    tdKey.setAttribute("style", "background-color: #8B0000; color: white");
                    tdValue.setAttribute("style", "background-color: #DC143C; color: white");
                    tr.appendChild(tdKey);
                    tr.appendChild(tdValue);
                    table.appendChild(tr);
                  }
                  message.textContent = "Solar potential";
                  calcDiv.appendChild(table);
                })
                .catch(() => {
                  message.textContent = "Server error";
                })
                .finally(() => { // Always, on success and on error, add a button to return to form
                  const button = document.createElement("button");
                  button.addEventListener("click", () => { // Button behavior
                    form.style.display = "block"; // Show form again
                    const tableDelete = document.querySelector("#calculation table");
                    if (tableDelete) {
                      calcDiv.removeChild(tableDelete); // Delete results table if present
                    }
                    calcDiv.removeChild(button); // Remove button
                    message.textContent = "Potential calculation";
                  });
                  button.textContent = "Back to form";
                  button.setAttribute("style", "margin-top: 20px");
                  calcDiv.appendChild(button);
                });
            });
          });

          // Existing system evaluation
          btnEvaluation.addEventListener("click", () => {
            document.getElementById("chart").style.display = "none"; // Hide charts
            // Show evaluation form
            calcDiv.innerHTML = `

            <h3>SolarCheckup Navigator</h3>
              
            <form method="POST" action='http://${this.url_server}:8000/existing/v1/result' id="existingMainForm">
              
              <label for="roof_tilt">Roof tilt: </label>
              <input style="margin: 5px 0; width: 120px" type="number" step="any" min="0" name="roof_tilt" value="20" required><br/>

              <label for="roof_orientation">Roof orientation: </label>
              <input style="margin: 0px 0; width: 120px" type="number" step="any" name="roof_orientation"  value="0" required><br/>
              <p style="margin: 0 10px 0 0; color: gray">(South=0, East=-90, North=180, West=90)</p><br/>

              <label for="nom_power">Nominal power: </label>
              <input style="margin: 0px 0; width: 120px" type="number" step="any" min="0" name="nom_power"  value="1" required><br/>

              <label for="real_last_year">Energy generated last year [kWh]: </label>
              <input style="margin: 5px 0; width: 120px" type="number" step="any" min="0" name="real_last_year" required><br/>

              <input style="margin: 5px 0" type="submit" value="Evaluate">
              <input style="margin: 5px 0" type="reset" value="Reset">

            </form>
            `
            let form = document.querySelector("form#existingMainForm") as HTMLFormElement;

            // By default, the current month is selected
            const currentMonth = (new Date()).getMonth() + 1;
            const options = document.getElementsByTagName("option");
            for (let option of options) {
              if (parseInt(option.value) == currentMonth) {
                option.setAttribute("selected", "true");
                break;
              }
            }
            
            form.addEventListener("submit", async(event) => {
              event.preventDefault(); // Prevent the form redirecting to another page
              const url = form.action; // Save in url variable the value of action attribute of the form
              const formData = new FormData(form); // Create an object containing the data inserted in the form
              formData.append("lat", latLng.lat); // Append to the formData object the latitude of the click
              formData.append("lon", latLng.lng); // Append to the formData object the longitude of the click
              await fetch(`http://${this.url_server}:8000/existing/v1/getCookie`, { method: "GET", credentials: "include" }); // Get the CSRF cookie from backend
              form.style.display = "none";  // Hide form
              const message = document.querySelector("#calculation h3");
              message.textContent = "Processing..."; // Change text to indicate that the processing of data is being made
              const headers = new Headers(); // Create an object to contain the headers of the request to server
              headers.append('X-CSRFToken', this.getCookie("csrftoken")) // Append the CSRF cookie to the headers object
              fetch(url, { method: "POST", headers: headers, body: formData, credentials: "include" }) // Obtain the KPIs from server with data inserted in the form
                .then(async(response) => {
                  // const result = await response.text();
                  // message.textContent = result;
                  const result = await response.json(); // Get JSON with response data
                  // console.log(result.generation_data);
                  
                  // Show messages
                  message.textContent = "SolarCheckup Navigator";
                  const expectedP = document.createElement("p");
                  expectedP.textContent = "Estimated yearly generation: " + result.estimated_generation + " kWh";
                  calcDiv.appendChild(expectedP);
                  const suggestionP = document.createElement("p");
                  suggestionP.textContent = result.suggestion;
                  suggestionP.setAttribute("style", "text-align: justify; text-justify: inter-word");
                  calcDiv.appendChild(suggestionP);
                  document.getElementById("month_selector").style.display = "block"; // Show month selector
                  
                  const comparationDiv = document.getElementById("comparation"); // Div where instructions are shown to evaluate the system
                  let max_month_generation;
                  document.getElementById("line_chart").style.display = "none"; // Hide line chart
                  let monthForm = document.querySelector("#month_selector form") as HTMLFormElement;
                  monthForm.addEventListener("submit", (event) => {
                    event.preventDefault();
                    const monthFormData = new FormData(monthForm); // Get selected month
                    const month = parseInt(monthFormData.get("month").toString()); // Parse month to int
                    max_month_generation = result.max_month_generation[month - 1]; // Get month data
                    this.chartDataLine = [result.generation_data[month - 1]]; // Set chart data with month data
                    const pChartDate = document.querySelector("div#chart p#chart_date");
                    pChartDate.innerHTML = result.generation_data[month - 1].name; // Subtitle of the chart, containing year, day and month shown
                    document.getElementById("line_chart").style.display = "block"; // Show line chart
                    document.getElementById("month_selector").style.display = "none"; // Hide month selection
                    // Show daily generation and instructions to compare
                    comparationDiv.innerHTML = `
                      <div style="margin-left: 20px">
                        <p>For the selected month, highest energy generation is: ${max_month_generation} kWh</p>
                        <p style="text-align: justify; text-justify: inter-word">
                          Open your photovoltaic system monitoring app. Compare the data shown in SolarCheckup
                          Navigator with the shape of the hourly generation profile in your app. Please choose a clear sky
                          day.
                        </p>
                        <p>Are them similar?</p>
                        <form id='radioForm'>
                          <input type="radio" id="yes" name="compare" value="Yes">
                          <label for="yes">Yes</label>
                          <input type="radio" id="no" name="compare" value="No">
                          <label for="no">No</label>
                          <input style="margin-left: 10px" type="submit" value="Submit">
                        </form>
                      </div>
                    `;

                    let radioForm = document.querySelector("form#radioForm") as HTMLFormElement;
                    radioForm.addEventListener("submit", (event) => {
                      event.preventDefault();
                      const radioFormData = new FormData(radioForm); // Get selection from yes/no
                      if (radioFormData.get("compare") == "Yes") {
                        // Show message of good performance
                        comparationDiv.innerHTML = `
                          <p style="text-align: justify; text-justify: inter-word">
                            Looks like your system is performing well. Try to repeat this
                            check monthly. If the monthly generation is very different with respect to the one expected, it
                            can be that your system is underperforming. Repeat this test and consider contacting a solar
                            expert for a field inspection.
                          </p>
                        `
                      } else {
                        // Show problem selection with images
                        comparationDiv.innerHTML = `
                          <div style="margin-left: 20px">
                            <p>If the curves are different you may have one of the following issues.</p>
                            <p>Select one for obtaining a suggestion:</p>
                            <form id="problemForm">

                              <input type="radio" id="1" name="problem" value="1">
                              <label for="1">Close shading</label><br/>
                              <img style="width: 250px; margin-bottom: 20px" src="../assets/img/problem_1.png"/><br/>

                              <input type="radio" id="2" name="problem" value="2">
                              <label for="2">Far shading (e. g. mountains)</label><br/>
                              <img style="width: 250px; margin-bottom: 20px" src="../assets/img/problem_1.png"/><br/>

                              <input type="radio" id="3" name="problem" value="3">
                              <label for="3">Soiling</label><br/>
                              <img style="width: 250px; margin-bottom: 20px" src="../assets/img/problem_1.png"/><br/>

                              <input type="radio" id="4" name="problem" value="4">
                              <label for="4">Modules broken/disconnected</label><br/>
                              <img style="width: 250px; margin-bottom: 20px" src="../assets/img/problem_1.png"/><br/>

                              <input type="radio" id="5" name="problem" value="5">
                              <label for="5">Overheating</label><br/>
                              <img style="width: 250px; margin-bottom: 20px" src="../assets/img/problem_1.png"/><br/>

                              <input type="radio" id="6" name="problem" value="6">
                              <label for="6">Snow</label><br/>
                              <img style="width: 250px; margin-bottom: 20px" src="../assets/img/problem_1.png"/><br/>

                              <input type="radio" id="7" name="problem" value="7">
                              <label for="7">Inverter failure</label><br/>
                              <img style="width: 250px; margin-bottom: 20px" src="../assets/img/problem_1.png"/><br/>

                              <input type="submit" value="Submit">

                            </form>
                          </div>
                        `

                        const problemForm = document.querySelector("form#problemForm") as HTMLFormElement;
                        problemForm.addEventListener("submit", (event) => {
                            event.preventDefault();
                            const problemFormData = new FormData(problemForm);
                            const selectedProblem = problemFormData.get("problem"); // Get problem selection
                            // Show problem selection and suggestion for it
                            comparationDiv.innerHTML = `
                              <div style="margin-left: 20px">
                                <p>Choice ${selectedProblem}, Suggestion ${selectedProblem}</p>
                              </div>
                            `
                        });
                      }
                    });
                  });

                  // Set chart data
                  document.getElementById("chart").style.display = "flex";
                  document.getElementById("chart").style.justifyContent = "space-evenly";
                  this.chartDataBarYear = [...result.yearly_generation, {"name" : "Actual", "value" : formData.get("real_last_year")}]; // Add actual generation data
                  console.log(result.yearly_generation);
                  this.chartDataBarMonth = result.monthly_generation;
                })
                .catch((error) => {
                  console.log(error);
                  message.textContent = "Error";
                })
                .finally(() => { // Show a button to return to form on success and on error
                  const button = document.createElement("button");
                  button.addEventListener("click", () => { // Button behavior
                    form.style.display = "block"; // Show form again
                    document.getElementById("chart").style.display = "none";
                    calcDiv.removeChild(button); // Remove button

                    // Remove all messages displayed. These are the suggestion and the expected generations
                    const pDelete = calcDiv.getElementsByTagName("p"); 
                    for (let i = pDelete.length - 1; i >= 0; i--) {
                      const pNode = pDelete[i];
                      calcDiv.removeChild(pNode);
                    }
                    message.textContent = "PV system evaluation";
                  });
                  button.textContent = "Back to form";
                  button.setAttribute("style", "margin-top: 20px");
                  calcDiv.appendChild(button);
                })
            });
          })
          // console.log(this.point);
          // document.cookie = "csrftoken" + '=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;'; //Delete cookie
        })
        .catch((error) => {
          console.error('Error al obtener el nombre de la calle:', error);
        });
    });

    // search widget
    const token = 'AAPK5405a7c87b1840238d0451576f7a4c56siHssPxZJRvP5MpPtAVXxjyJcvyuhicuES_NHhvk2J-TRG_COpGkw91f17oH7vQY'

    const searchControl = new esri_geo.Geosearch({ 
      useMapBounds: false, 
      expanded: true,
      providers: [
        esri_geo.arcgisOnlineProvider({
          apikey: token
        })
      ]
    }).addTo(this.map);
    
    const results = L.layerGroup().addTo(this.map);

    searchControl.on('results', function(data) {
      results.clearLayers();
      for (let i = data.results.length - 1; i >= 0; i--) {
        //results.addLayer(L.marker(data.results[i].latlng));
      }
    });

    // Adjust the position of the zoom controls
    this.map.zoomControl.setPosition('topright');
  }

}
