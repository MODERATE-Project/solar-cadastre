import { Component, Renderer2, OnInit } from '@angular/core';
import { BuildingsService } from 'src/app/services/buildings.service';
import { CoordinatesService } from 'src/app/services/coordinates.service';
import axios from 'axios';
import * as esri_geo from 'esri-leaflet-geocoder';
import * as L from 'leaflet';
import { environment } from 'src/environments/environment';


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
        token: environment.arcgisToken
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
          <h2 style="font-weight: 700; color: #051B39">${streetName}</h2>
          <br>
          <h5 style="font-weight: 700; color: #0D5D93">Building information</h5>
          `
          +
          `
          <div class="container">
            <div class="row">
              <div class="col-sm">
                <p style="font-weight: 400; color: #052D65"; opacity: 0.6>Area</p>
                <h5 style="font-weight: 700; color: #051B39">${buildingInfo.area.toFixed(2)} m<sup>2</sup></h5>
              </div>
              <div class="col-sm">
                <p style="font-weight: 400; color: #052D65"; opacity: 0.6>Floors</p>
                <h5 style="font-weight: 700; color: #051B39">${buildingInfo.floors}</h5>
              </div>
              <div class="col-sm">
                <p style="font-weight: 400; color: #052D65"; opacity: 0.6>PV nominal power convinient surface</p>
                <h5 style="font-weight: 700; color: #051B39">${buildingInfo.pv_nominal.toFixed(2)} kWp</h5>
              </div>
              <div class="col-sm">
                <p style="font-weight: 400; color: #052D65"; opacity: 0.6>Average yield</p>
                <h5 style="font-weight: 700; color: #051B39">${buildingInfo.average_yi.toFixed(2)} kWh/kWp</h5>
              </div>
            </div>

            <div class="row">
              <div class="col-sm">
                <p style="font-weight: 400; color: #052D65"; opacity: 0.6>Building use</p>
                <h5 style="font-weight: 700; color: #051B39">${useBuilding}</h5>
              </div>
              <div class="col-sm">
                <p style="font-weight: 400; color: #052D65"; opacity: 0.6>Thermal needs</p>
                <h5 style="font-weight: 700; color: #051B39">${buildingInfo.thermal_ne.toFixed(2)}</h5>
              </div>
              <div class="col-sm">
                <p style="font-weight: 400; color: #052D65"; opacity: 0.6>Potential PV energy</p>
                <h5 style="font-weight: 700; color: #051B39">${buildingInfo.potential_.toFixed(2)} kWp</h5>
              </div>
              <div class="col-sm">
                <p style="font-weight: 400; color: #052D65"; opacity: 0.6>Potential CO<sub>2</sub> emission reduction</p>
                <h5 style="font-weight: 700; color: #051B39">${buildingInfo.potentialc.toFixed(2)} kgCO<sub>2</sub></h5>
              </div>
            </div>

            <div class="row">
              <div class="col-sm">
                <p style="font-weight: 400; color: #052D65"; opacity: 0.6>Year of construction</p>
                <h5 style="font-weight: 700; color: #051B39">${buildingInfo.year_const}</h5>
              </div>
              <div class="col-sm">
                <p style="font-weight: 400; color: #052D65"; opacity: 0.6>Area convinient for PV</p>
                <h5 style="font-weight: 700; color: #051B39">${buildingInfo.area_convi.toFixed(2)} m<sup>2</sup></h5>
              </div>
              <div class="col-sm">
              </div>
              <div class="col-sm">
              </div>
            </div>
          </div>

          <br>

          <h5 style="font-weight: 700; color: #134EA1">Raster information</h5>
          <table style="width: 100%; margin-left: 15px">
            <tr>
              <td>
                <div class="row" style="background-color: #F8F7F7; border-radius: 10px; width: 99%">
                  <div class="col-sm">
                    <p style="font-weight: 400; color: #051B39">Solar irradiance</p>
                  </div>
                  <div class="col-sm">
                    <p style="font-weight: 700; color: #051B39">${buildingInfo.solar_irra.toFixed(2)} kWh/m<sup>2</sup></p>
                  </div>
                </div>
              </td>
              <td>
                <div class="row" style="background-color: #F8F7F7; border-radius: 10px; width: 99%">
                  <div class="col-sm">
                    <p style="font-weight: 400; color: #052D65"; opacity: 0.6>PV generation</p>
                  </div>
                  <div class="col-sm">
                    <p style="font-weight: 700; color: #051B39">${buildingInfo.pv_generat.toFixed(2)} kWh/m<sup>2</sup></p>
                  </div>
                </div>
              </td>
            </tr>
          </table>

          <br/>
          
          `
          // +
          // Cards
          // `
          //  <div class="row">

          //   <div class="col-sm-4">
          //       <div class="card text-white">
          //         <div class="card-header" style="background-color: #004470">
          //           <p class="card-title">Area</p>
          //         </div>
          //         <div class="card-body" style="background-color: #2c6488">
          //           <h3 class="card-text">${buildingInfo.area.toFixed(2)} m<sup>2</sup></h3> 
          //         </div>
          //       </div>
          //     </div>

          //     <div class="col-sm-4">
          //       <div class="card text-white">
          //         <div class="card-header" style="background-color: #004470">
          //             <p class="card-title">Year of construction</p>
          //         </div>
          //         <div class="card-body" style="background-color: #2c6488">
          //           <h3 class="card-text">${buildingInfo.year_const}</h3> 
          //         </div>
          //       </div>
          //     </div>

          //     <div class="col-sm-4">
          //       <div class="card text-white">
          //         <div class="card-header" style="background-color: #004470">
          //           <p class="card-title">Thermal needs</p>
          //         </div>
          //         <div class="card-body" style="background-color: #2c6488">
          //           <h3 class="card-text">${buildingInfo.thermal_ne.toFixed(2)}</h3> 
          //         </div>
          //       </div>
          //     </div>

          //   </div>

          //   <br/>

          //   <div class="row">
          //     <div class="col-sm-4">
          //         <div class="card text-white">
          //           <div class="card-header" style="background-color: #004470">
          //             <p class="card-title">Area convinient for PV</p>
          //           </div>
          //           <div class="card-body" style="background-color: #2c6488">
          //             <h3 class="card-text">${buildingInfo.area_convi.toFixed(2)} m<sup>2</sup></h3> 
          //           </div>
          //         </div>
          //       </div>

          //       <div class="col-sm-4">
          //         <div class="card text-white">
          //           <div class="card-header" style="background-color: #004470">
          //             <p class="card-title">PV nominal power convinient surface</p>
          //           </div>
          //           <div class="card-body" style="background-color: #2c6488">
          //             <h3 class="card-text">${buildingInfo.pv_nominal.toFixed(2)} kWp</h3> 
          //           </div>
          //         </div>
          //       </div>

          //       <div class="col-sm-4">
          //         <div class="card text-white">
          //           <div class="card-header" style="background-color: #004470">
          //             <p class="card-title">Potential PV energy</p>
          //           </div>
          //           <div class="card-body" style="background-color: #2c6488">
          //             <h3 class="card-text">${buildingInfo.potential_.toFixed(2)} kWh/year</h3> 
          //           </div>
          //         </div>
          //       </div>
          //   </div>

          //   <br/>

          //   <div class="row">
          //     <div class="col-sm-4">
          //       <div class="card text-white">
          //         <div class="card-header" style="background-color: #004470">
          //           <p class="card-title">Average yield</p>
          //         </div>
          //         <div class="card-body" style="background-color: #2c6488">
          //           <h3 class="card-text">${buildingInfo.average_yi.toFixed(2)} kWh/kWp</h3> 
          //         </div>
          //       </div>
          //     </div>

          //     <div class="col-sm-4">
          //       <div class="card text-white">
          //         <div class="card-header" style="background-color: #004470">
          //           <p class="card-title">Potential CO<sub>2</sub> emission reduction</p>
          //         </div>
          //         <div class="card-body" style="background-color: #2c6488">
          //           <h3 class="card-text">${buildingInfo.potentialc.toFixed(2)} kgCO<sub>2</sub></h3> 
          //         </div>
          //       </div>
          //     </div>

          // </div>

          // <br/>

          // `

          //+

          // `
          // <table class="table" style="background-color: #FAFAFA; border: 1px solid black;">
          //   <tr rowspan="2">
          //     <td style="background-color: #004470; color: white;">Area</td>
          //     <td style="background-color: #2c6488; color: white;">${buildingInfo.area.toFixed(2)} m<sup>2</sup></td>
          //   </tr>
          //   <tr>
          //     <td style="background-color: #004470; color: white;">Building use</td>
          //     <td style="background-color: #2c6488; color: white;">${useBuilding}</td>
          //   </tr>
          //   <tr>
          //     <td style="background-color: #004470; color: white;">Year of construction</td>
          //     <td style="background-color: #2c6488; color: white;">${buildingInfo.year_const}</td>
          //   </tr>
          //   <tr>
          //     <td style="background-color: #004470; color: white;">Floors</td>
          //     <td style="background-color: #2c6488; color: white;">${buildingInfo.floors}</td>
          //   </tr>
          //   <tr>
          //     <td style="background-color: #004470; color: white;">Thermal needs</td>
          //     <td style="background-color: #2c6488; color: white;">${buildingInfo.thermal_ne.toFixed(2)}</td>
          //   </tr>
          //   <tr>
          //     <td style="background-color: #004470; color: white;">Area convinenient for PV</td>
          //     <td style="background-color: #2c6488; color: white;">${buildingInfo.area_convi.toFixed(2)} m<sup>2</sup></td>
          //   </tr>
          //   <tr>
          //     <td style="background-color: #004470; color: white;">PV nominal power convinenient surface</td>
          //     <td style="background-color: #2c6488; color: white;">${buildingInfo.pv_nominal.toFixed(2)} kWp</td>
          //   </tr>
          //   <tr>
          //     <td style="background-color: #004470; color: white;">Potential PV energy</td>
          //     <td style="background-color: #2c6488; color: white;">${buildingInfo.potential_.toFixed(2)} kWh/year</td>
          //   </tr>
          //   <tr>
          //     <td style="background-color: #004470; color: white;">Average yield</td>
          //     <td style="background-color: #2c6488; color: white;">${buildingInfo.average_yi.toFixed(2)} kWh/kWp</td>
          //   </tr>
          //   <tr>
          //     <td style="background-color: #004470; color: white;">Potential CO<sub>2</sub> emission reduction</td>
          //     <td style="background-color: #2c6488; color: white;">${buildingInfo.potentialc.toFixed(2)} kgCO<sub>2</sub></td>
          //   </tr>
          // </table>

        //   <table class="table" style="border: 1px solid black;">
        //     <tr>
        //       <td style="background-color: #004470; color: white;">Solar irradiance</td>
        //       <td style="background-color: #2c6488; color: white;">${buildingInfo.solar_irra.toFixed(2)} kWh/m<sup>2</sup></td>
        //     </tr>
        //     <tr>
        //       <td style="background-color: #004470; color: white;">PV generation</td>
        //       <td style="background-color: #2c6488; color: white;">${buildingInfo.pv_generat.toFixed(2)} kWh/m<sup>2</sup></td>
        //     </tr>
        //   </table>
        //   <br>
        // `
        );

        this.visible = true;

      })
      .catch((error) => {
        console.error('Error al obtener el nombre de la calle:', error);
      });

  }

}
