import { Component, OnInit, ViewChild } from '@angular/core';
import * as L from 'leaflet';
import * as esri_geo from 'esri-leaflet-geocoder';
import * as esri from 'esri-leaflet'
import { CoordinatesService } from 'src/app/services/coordinates.service';
import { TablesComponent } from '../tables/tables.component';
import 'proj4leaflet'; 
import { ShowTablesDirective } from 'src/app/directives/show-tables.directive';
import { ShowCalculationsDirective } from 'src/app/directives/show-calculations.directive';
import { CalculateDataComponent } from '../calculate-data/calculate-data.component';
import "@geoman-io/leaflet-geoman-free";
import { BuildingsService } from 'src/app/services/buildings.service';
import { TableSumComponent } from '../table-sum/table-sum.component';
import { PolygonService } from 'src/app/services/polygon.service';
import { SolarPotentialComponent } from '../solar-potential/solar-potential.component';
import { ExistingSystemComponent } from '../existing-system/existing-system.component';



@Component({
  selector: 'app-map',
  templateUrl: './map.component.html',
  styleUrls: ['./map.component.scss']
})

export class MapComponent implements OnInit {
  @ViewChild (ShowTablesDirective) public showTables: ShowTablesDirective;
  @ViewChild (ShowCalculationsDirective) public showCalculations: ShowCalculationsDirective;

  private marker: L.Marker | null = null;
  private map;

  private geoserverURL = "/"; // FIXME poner la url adecuada
  private pvGenerationCells = "/geoserver/GeoModerate/wms?"; // FIXME poner la url adecuada

  private buildingCadastral = "/geoserver/GeoModerate/wms?" // FIXME poner la url adecuada

  point: any;
  visibleMessage: boolean = true;
  visibleLink: boolean = false;
  visibleBack: boolean = false;


  WMS_CADASTRE = 'https://ovc.catastro.meh.es/Cartografia/WMS/ServidorWMS.aspx?';
  properties: any[];

  constructor(private coordinatesServices: CoordinatesService, private buildingServices: BuildingsService, private polygonService: PolygonService) { }

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
    this.showTables.viewContainerRef.clear();
    this.showTables.viewContainerRef.createComponent(SolarPotentialComponent);
    this.visibleLink = false;
  }

  public activateExisting() {
    this.showTables.viewContainerRef.clear();
    this.showTables.viewContainerRef.createComponent(ExistingSystemComponent);
    this.visibleLink = false;
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
      pathOptions: {
        weight: 2,
        color: "#4d4d4d",
        fillColor: "#808080",
        fillOpacity: 0.2,
        dashArray:[4, 4]}
    });

    var previousLayer;

    this.map.on("pm:create", ({shape,layer}) => {

      if (previousLayer) {
        previousLayer.remove();
      }
      previousLayer = layer;

      var feature = layer.toGeoJSON();

      console.log(feature);
      // console.log(feature.geometry.coordinates[0]);

      this.visibleMessage = false;


      if (shape == "Marker") {
        this.coordinatesServices.setCoordinates({"lat" : feature.geometry.coordinates[1], "lng" : feature.geometry.coordinates[0]});
        this.showTables.viewContainerRef.clear();
        this.showTables.viewContainerRef.createComponent(TablesComponent);
        this.visibleLink = true;
      } else if (shape == "Polygon") {
        this.polygonService.setPolygon(feature.geometry.coordinates[0]);
        this.showTables.viewContainerRef.clear();
        this.showTables.viewContainerRef.createComponent(TableSumComponent);
        this.visibleLink = false;

      }



    });
  }

}
