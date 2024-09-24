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
  streetName: any;
  buildingInfo: any;
  useBuilding: any;

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

    this.buildingServices.getBuildingsFeature(this.coordinates.lng, this.coordinates.lat).then((data)=> {
      this.buildingInfo = JSON.parse(data).features[0].properties;
      console.log(this.buildingInfo);
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
        this.streetName = response.data.address.Address;
        this.useBuilding = nominatimResponse.data.type;
        // const useBuilding = "residential"
        
        // Actualizar el contenido del div con los datos, incluyendo el nombre de la calle
        const datosContainer = document.getElementById('tablas');

        this.visible = true;

      })
      .catch((error) => {
        console.error('Error al obtener el nombre de la calle:', error);
      });

  }

}
