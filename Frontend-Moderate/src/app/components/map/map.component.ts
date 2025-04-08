import { Component, OnInit, ViewChild } from '@angular/core';
import * as L from 'leaflet';
import * as esri_geo from 'esri-leaflet-geocoder';
import * as esri from 'esri-leaflet'
import 'proj4leaflet';
import { ShowTablesDirective } from 'src/app/directives/show-tables.directive';
import { ShowCalculationsDirective } from 'src/app/directives/show-calculations.directive';
import { CalculateDataComponent } from '../calculate-data/calculate-data.component';
import "@geoman-io/leaflet-geoman-free";
import { BuildingsService } from 'src/app/services/buildings.service';
import { SolarPotentialComponent } from '../solar-potential/solar-potential.component';
import { ExistingSystemComponent } from '../existing-system/existing-system.component';
import { environment } from 'src/environments/environment';
import { TablesComponent } from '../tables/tables.component';
import { CoordinatesService } from 'src/app/services/coordinates.service';
import { CityService } from 'src/app/services/city.service';
import { WindowService } from 'src/app/services/window.service';

@Component({
  selector: 'app-map',
  templateUrl: './map.component.html',
  styleUrls: ['./map.component.scss']
})

export class MapComponent implements OnInit {
  @ViewChild (ShowTablesDirective) public showTables: ShowTablesDirective;
  @ViewChild (ShowCalculationsDirective) public showCalculations: ShowCalculationsDirective;

  coordinates: any = {
    lat: null,
    lng: null
  };

  private searchMarker: L.Marker | null = null;
  private previousLayer;

  window: number = 0;

  //table component window == 1
  buildingInfo: any = null;

  //table sum component window == 2
  totalData: any = {
    "area_conv" : 0,
    "nom_power" : 0,
    "potential" : 0,
    "av_yield" : 0,
    "co2" : 0
  };


  private map;
  private pvGenerationCells = `${environment.geoserverUrl}/wms?`;
  //private buildingCadastral = "https://re-modulees.five.es:8443/geoserver/Remodulees/wms?"
  private buildingCadastral = `${environment.geoserverUrl}/wms?`

  point: any;
  visibleMessage: boolean = true;
  visibleLink: boolean = false;
  visibleBack: boolean = false;


  WMS_CADASTRE = 'https://ovc.catastro.meh.es/Cartografia/WMS/ServidorWMS.aspx?';
  properties: any[];

  constructor(
    private buildingServices: BuildingsService,
    private coordinatesServices: CoordinatesService,
    private cityService: CityService,
    private windowService: WindowService
  ) { 
    this.windowService.currentWindow.subscribe(window => this.window = window);
    this.windowService.currentVisibleLink.subscribe(visibleLink => this.visibleLink = visibleLink);
  }

  //Get cookie value, indicating the name of the cookie

  ngOnInit(): void {
    this.initMap();
  }

  public activateCalculations() {
    this.showTables.viewContainerRef.clear();
    this.showTables.viewContainerRef.createComponent(CalculateDataComponent);
    this.visibleLink = false;
  }

  public activatePotential() {
    /*this.showTables.viewContainerRef.clear();
    this.showTables.viewContainerRef.createComponent(SolarPotentialComponent);*/
    this.visibleLink = false;
    this.window = 3;
  }

  public activateExisting() {
    /*this.showTables.viewContainerRef.clear();
    const componentRef = this.showTables.viewContainerRef.createComponent(ExistingSystemComponent);
    componentRef.instance.backToMap.subscribe(() => {
      this.showTables.viewContainerRef.clear();
      this.showTables.viewContainerRef.createComponent(TablesComponent);
      this.visibleLink = true;
      this.visibleBack = false;
    });*/
    this.visibleLink = false;
    this.window = 4;
  }

  public disableCalculations() {
    document.querySelector("div#calculations").setAttribute("style", "display: none");
    this.showCalculations.viewContainerRef.clear();
    document.querySelector("div#map").setAttribute("style", "display: flex");
    this.visibleBack = false;
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
      layers: 'Remodulees:PV generation convinient cells',
      tileSize: 2080,
    });

    const buildingCadastralLayer = L.tileLayer.wms(this.buildingCadastral, {
      format: 'image/png',
      transparent: true,
      layers: 'Moderate:cadastral_buildings',
      tileSize: 3080,
      crs: crs25830
    });

    const overlayMaps = {
      "PV generation convinient cells": buildingPVGeneration,
      "Cadastral buildings": buildingCadastralLayer,
      "Cadastre": cadastreLayer,
    };


    L.control.layers(baseMaps, overlayMaps).addTo(this.map);

    // this.map.on('click', async (event) => {

    //   this.visibleLink = false;

    //   if (this.marker) {
    //     this.marker.setLatLng(event.latlng);
    //     console.log(event.latlng);
    //   } else {
    //     this.marker = L.marker(event.latlng, { icon: customIcon }).addTo(this.map);
    //   }

    //   const latLng = event.latlng;
    //   // this.coordinatesServices.sendCoordinates(latLng)
    //   this.coordinatesServices.setCoordinates(latLng);

    //   this.visibleMessage = false;

    //   this.showTables.viewContainerRef.clear();
    //   this.showTables.viewContainerRef.createComponent(TablesComponent);

    //   this.visibleLink = true;

      
    //   /*const popup = L.popup()
    //     .setLatLng(latLng)
    //     .setContent('You click in this position')
    //     .openOn(this.map)*/
    //   // Puedes realizar cualquier acción adicional con las coordenadas del clic aquí

    //   });

    // search widget
    const token = environment.arcgisToken

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

    searchControl.on('results', (data) => {
      results.clearLayers();
      if (this.searchMarker) {
        this.map.removeLayer(this.searchMarker);
      }
      for (let i = data.results.length - 1; i >= 0; i--) {
        this.searchMarker = L.marker(data.results[i].latlng, { icon: customIcon }).addTo(this.map);
        this.coordinates.lat = data.results[i].latlng.lat;
        this.coordinates.lng = data.results[i].latlng.lng;
        this.buildingServices.getBuildingsFeature(this.coordinates.lng, this.coordinates.lat).subscribe( (data: any) => {
          this.buildingInfo = JSON.parse(data).features[0].properties;
          this.window = 1;
          this.visibleLink = true;
          this.visibleMessage = false;
        })
      }
    });

    // Adjust the position of the zoom controls
    this.map.zoomControl.setPosition('topright');

    this.map.pm.addControls({
      position:'topright',
      // Customize the visible tools
      editControls: false,
      drawRectangle: false,
      drawCircle: false,
      drawCircleMarker: false,
      drawText: false,
      drawPolyline: false
    });

    this.map.pm.setGlobalOptions({
      markerStyle: {
        icon: customIcon
      },    
      pathOptions: {
        weight: 2,
        color: "#4d4d4d",
        fillColor: "#808080",
        fillOpacity: 0.2,
        dashArray:[4, 4]
      }
    });

    this.map.on("pm:create", ({shape,layer}) => {

      if (this.previousLayer) {
        this.previousLayer.remove();
      }
      this.previousLayer = layer;

      var feature = layer.toGeoJSON();
      console.log(feature);

      this.coordinates.lat = feature.geometry.coordinates[1];
      this.coordinates.lng = feature.geometry.coordinates[0];

      this.visibleMessage = false;

      if (shape == "Marker") {
        layer.setIcon(customIcon);

        this.coordinatesServices.setCoordinates({"lat" : this.coordinates.lat, "lng" : this.coordinates.lng});

        this.buildingServices.getBuildingsFeature(this.coordinates.lng, this.coordinates.lat).subscribe( (data: any) => {
          this.buildingInfo = JSON.parse(data).features[0].properties;
          this.window = 1;
          this.visibleLink = true;
        })

      } else if (shape == "Polygon") {

        this.buildingServices.getBuildingsFeaturePolygon(this.coordinates.lng).then((data) => {
          const featureList = JSON.parse(data).features;
          console.log(featureList);

          for (let feature of featureList) {
            this.totalData.area_conv += feature.properties.area_convi;
            this.totalData.nom_power += feature.properties.pv_nominal;
            this.totalData.potential += feature.properties.potential_;
            this.totalData.av_yield += feature.properties.average_yi;
            this.totalData.co2 += feature.properties.potentialc;
          }

          console.log(this.totalData);

          this.window = 2;
          this.visibleLink = false;

        })

        //this.polygonService.setPolygon(this.coordinates.lng);
        //this.showTables.viewContainerRef.clear();
        //this.showTables.viewContainerRef.createComponent(TableSumComponent);

      }

    });
  }

}