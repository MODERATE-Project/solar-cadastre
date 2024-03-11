import { Component, Renderer2, OnInit } from '@angular/core';
import { BuildingsService } from 'src/app/services/buildings.service';
import { CoordinatesService } from 'src/app/services/coordinates.service';
import axios from 'axios';
import * as esri_geo from 'esri-leaflet-geocoder';
import * as L from 'leaflet';


@Component({
  selector: 'app-tables',
  templateUrl: './tables.component.html',
  styleUrls: ['./tables.component.scss']
})
export class TablesComponent implements OnInit {

  coordinates: {lat: number, lng: number};
  point: any;
  properties: any[];
  visible: boolean = false;

  constructor (private coordinatesService: CoordinatesService, private buildingServices: BuildingsService, private renderer: Renderer2) { }

  async ngOnInit() {
    this.coordinates = this.coordinatesService.getCoordinates();
    await this.showTables();
  }

  async showTables() {

    const crs25830 = new L.Proj.CRS('EPSG:25830',
     '+proj=utm +zone=30 +ellps=GRS80 +units=m +no_defs',
     {
       resolutions: [2048, 1024, 512, 256, 128, 64, 32, 16, 8, 4, 2, 1, 0.5],
       origin: [0, 0]
     });

    this.point = crs25830.project(this.coordinates);

    const geocodeService = esri_geo.geocodeService();
    this.properties = [];
    let address = '';

    geocodeService.reverse().latlng(this.coordinates).run((error, result) => {
      if (error) {
        return;
      }
      address = result.address.Address;
    });

    let buildingInfo;

    this.buildingServices.getBuildingsFeature(this.coordinates.lng, this.coordinates.lat).then((data)=> {
      buildingInfo = JSON.parse(data).features[0].properties;
      console.log(buildingInfo);
    })

    const nominatimResponse = await axios.get('https://nominatim.openstreetmap.org/reverse', {
        params: {
          lat: this.coordinates.lat,
          lon: this.coordinates.lng,
          format: 'json'
        }
    });

    axios.get(`https://geocode.arcgis.com/arcgis/rest/services/World/GeocodeServer/reverseGeocode`, {
      params: {
        location: `${this.coordinates.lng},${this.coordinates.lat}`,
        f: 'json',
        token: 'AAPK5405a7c87b1840238d0451576f7a4c56siHssPxZJRvP5MpPtAVXxjyJcvyuhicuES_NHhvk2J-TRG_COpGkw91f17oH7vQY'
      }
    })
      .then((response) => {
        console.log(response)
        const streetName = response.data.address.Address;
        const useBuilding = nominatimResponse.data.type;
        // const useBuilding = "residential"
        
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
        `
          // <h3>Selected area information</h3>
          // <table style="border: 1px solid black;">
          //   <tr>
          //     <td style="background-color: #B45F04; color: white;">Sum of area convinient for PV</td>
          //     <td style="background-color: #DF7401; color: white;">${buildingInfo.solar_irra} m<sup>2</sup></td>
          //   </tr>
          //   <tr>
          //     <td style="background-color: #B45F04; color: white;">Sum of PV nominal power convinient for PV</td>
          //     <td style="background-color: #DF7401; color: white;">${buildingInfo.pv_generat} kWp</td>
          //   </tr>
          //   <tr>
          //     <td style="background-color: #B45F04; color: white;">Sum of potential PV energy</td>
          //     <td style="background-color: #DF7401; color: white;">${buildingInfo.potentialp} kWh/year</td>
          //   </tr>
          //   <tr>
          //     <td style="background-color: #B45F04; color: white;">Average yield</td>
          //     <td style="background-color: #DF7401; color: white;">${buildingInfo.average_yi} kWh/kWp</td>
          //   </tr>
          //   <tr>
          //     <td style="background-color: #B45F04; color: white;">Sum of potential CO<sub>2</sub> emission reduction</td>
          //     <td style="background-color: #DF7401; color: white;">${buildingInfo.pv_generat} kgCO<sub>2</sub></td>
          //   </tr>
          // </table>

          // <br>
        );

        this.visible = true;

      })
      .catch((error) => {
        console.error('Error al obtener el nombre de la calle:', error);
      });

  }

}
