import { Component, OnInit, Renderer2 } from '@angular/core';
import * as L from 'leaflet';
import * as esri_geo from 'esri-leaflet-geocoder';
import * as esri from 'esri-leaflet'
import axios from 'axios';
import { BuildingsService } from 'src/app/services/buildings.service';
import 'proj4leaflet';

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

  constructor(private renderer: Renderer2, private buildingServices: BuildingsService) { }

  //Get cookie value
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
          
          // Actualizar el contenido del div con los datos, incluyendo el nombre de la calle
          const datosContainer = document.getElementById('datos-container');
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

            <div id='calculation'>

              <h3>Potential calculation</h3>
            
              <form method="POST" action='http://localhost:8000/v2/potential/result'>

                <label for="roof_tilt">Roof tilt: </label>
                <input style="margin: 5px 0; width: 120px" type="number" step="any" min="0" name="roof_tilt" required><br/>

                <label for="roof_orientation">Roof orientation: </label>
                <input style="margin: 5px 0; width: 120px" type="number" step="any" name="roof_orientation" required><br/>

                <label for="nom_power">Nominal power [kWp]: </label>
                <input style="margin: 5px 0; width: 120px" type="number" step="any" min="0" name="nom_power" required><br/>
                
                <label for="yearly_consumption">Yearly consumption [kWh]: </label>
                <input style="margin: 5px 0; width: 120px: " type="number" step="any" min="0" name="yearly_consumption" required><br/>

                <label for="electricity_cost">Electricity cost [€/kWh]: </label>
                <input style="margin: 5px 0; width: 120px" type="number" step="0.01" min="0" name="electricity_cost"><br/>

                <label for="value_sold_electricity">Value of sold electricity [€/kWh]: </label>
                <input style="margin: 5px 0; width: 120px" type="number" step="0.01" min="0" name="value_sold_electricity" required><br/>

                <label for="pv_cost">PV cost [€/kWp]: </label>
                <input style="margin: 5px 0; width: 120px" type="number" step="0.01" min="0" name="pv_cost" required><br/>

                <input style="margin: 5px 0" type="submit" value="Calculate">
                <input style="margin: 5px 0" type="reset" value="Reset">

              </form>

            </div>

            `
          );
        })
        .then(async() => {
          console.log(latLng);
          // console.log(this.point);
          // document.cookie = "csrftoken" + '=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;'; //Delete cookie
          let form = document.querySelector("form");
          form.addEventListener("submit", async(event) => { // Actions to perform when submitting the form
            event.preventDefault(); // Prevent the form redirecting to another page
            const url = form.action; // Save in url variable the value of action attribute of the form
            const formData = new FormData(form); // Create an object containing the data inserted in the form
            formData.append("lat", latLng.lat); // Append to the formData object the latitude of the click
            formData.append("lon", latLng.lng); // Append to the formData object the longitude of the click
            await fetch("http://localhost:8000/v2/getCookie", { method: "GET", credentials: "include" }); // Get the CSRF cookie from backend
            form.style.display = "none";  // Hide form
            const formContainer = document.getElementById("calculation");
            const message = document.querySelector("#calculation h3");
            message.textContent = "Processing..."; // Change text to indicate that the processing of data is being made
            const headers = new Headers(); // Create an object to contain the headers of the request to server
            headers.append('X-CSRFToken', this.getCookie("csrftoken")) // Append the CSRF cookie to the headers object
            fetch(url, { method: "POST", headers: headers, body: formData, credentials: "include" }) // Obtain the KPIs from server with data inserted in the form
              .then(async(response) => {
                const data = await response.json();
                const table = document.createElement("table");
                table.setAttribute("style", "border: 1px solid; width: 100%");
                for (const key in data) {  // Create table with results
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
                formContainer.appendChild(table);
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
                    formContainer.removeChild(tableDelete); // Delete results table if present
                  }
                  formContainer.removeChild(button); // Remove button
                  message.textContent = "Potential calculation";
                });
                button.textContent = "Back to form";
                button.setAttribute("style", "margin-top: 20px");
                formContainer.appendChild(button);
              });
          });
        })
        .catch((error) => {
          console.error('Error al obtener el nombre de la calle:', error);
        });

        // let consumption = prompt("Enter your consumption")
        // if (consumption != null && consumption != "") {
        //   const formData = new FormData();
        //   formData.append("lat", latLng.lat);
        //   formData.append("lon", latLng.lng);
        //   // formData.append("x_coord", this.point.x);
        //   // formData.append("y_coord", this.point.y);
        //   const response = await fetch("http://localhost:8000/v1/potential/form", { method: "POST", body: formData });
        //   const potential = await response.text();
        //   console.log(response);
        //   console.log(potential);
        //   if (response.status == 200) {
        //     window.alert("Your potential is: " + potential);
        //   } else if (response.status == 400) {
        //     window.alert(potential);
        //   } else {
        //     window.alert("Server error");
        //   }
        // }

        // console.log("latLng: " + latLng);
        // console.log("Point: " + this.point);      
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
