import { Injectable } from '@angular/core';
import {HttpClient, HttpEvent, HttpHeaders, HttpParams} from '@angular/common/http';
import {Observable} from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class BuildingsService {

  private urlCadastralBuildings = 'http://80.211.131.194:8080/geoserver/GeoModerate/ows';

  constructor(private http: HttpClient) { }

  getBuildingsFeature(lon: number, lat: number): Promise<any>{
    const header = new HttpHeaders({ Accept: 'application/xml'});
    const params = new HttpParams()
      .set('service', 'wfs')
      .set('version', '1.0.0')
      .set('request', 'getFeature')
      .set('typeName', 'GeoModerate:cadastral_buildings')
      .set('maxFeatures', 50)
      .set('cql_filter', `INTERSECTS(geom, POINT(${lon} ${lat}))`)
      .set('outputFormat', 'application/json');
    
    const options = {
      header,
      params,
      responseType: 'text' as 'text'
    };

    return this.http.request('GET', this.urlCadastralBuildings, options).toPromise();
  }

  getBuildingsFeaturePolygon(geometry: number[][]): Promise<any>{
    let polygon = "";
    for (let point of geometry) {
      polygon += `${point[0]} ${point[1]}, `
    }
    polygon = polygon.slice(0, -1);
    polygon = polygon.slice(0, -1);
    const header = new HttpHeaders({ Accept: 'application/xml'});
    const params = new HttpParams()
      .set('service', 'wfs')
      .set('version', '1.0.0')
      .set('request', 'getFeature')
      .set('typeName', 'GeoModerate:cadastral_buildings')
      .set('cql_filter', `INTERSECTS(geom, POLYGON((${polygon})))`)
      .set('outputFormat', 'application/json');
    
    const options = {
      header,
      params,
      responseType: 'text' as 'text'
    };

    return this.http.request('GET', this.urlCadastralBuildings, options).toPromise();
  }
}
