import { Component, Renderer2, OnInit, Input, ChangeDetectorRef } from '@angular/core';
import axios from 'axios';
import * as esri_geo from 'esri-leaflet-geocoder';
import * as L from 'leaflet';
import { environment } from 'src/environments/environment';
import { CoordinatesService } from 'src/app/services/coordinates.service';


@Component({
  selector: 'app-tables',
  templateUrl: './tables.component.html',
  styleUrls: ['./tables.component.scss']
})
export class TablesComponent implements OnInit {

  @Input() buildingInfo: any;
  @Input() coordinates: any = {
    lat: null,
    lng: null
  };

  point: any;
  properties: any[];
  streetName: any;
  useBuilding: any;
  visible: boolean = false;

  constructor (private coordinatesService: CoordinatesService) {
  }

  async ngOnInit() {
    //this.coordinates = this.coordinatesService.getCoordinates();
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
        this.streetName = response.data.address.Address;
        this.useBuilding = nominatimResponse.data.type;
        // const useBuilding = "residential"

        this.visible = true;
      })
      .catch((error) => {
        console.error('Error al obtener el nombre de la calle:', error);
      });

  }

}