import { Injectable } from '@angular/core';
import {HttpClient, HttpEvent, HttpHeaders, HttpParams} from '@angular/common/http';
import {Observable} from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class BuildingsService {

  private urlCadastralBuildings = 'http://80.211.131.194:8080/geoserver/GeoModerate/ows';

  constructor(private http: HttpClient) { }

  getBuildingsFeature(lat: number, lon: number): Promise<any>{
    const header = new HttpHeaders({ Accept: 'application/xml'});
    const params = new HttpParams()
      .set('service', 'wfs')
      .set('version', '1.0.0')
      .set('request', 'getFeature')
      .set('typeName', 'GeoModerate:cadastral_buildings')
      .set('maxFeatures', 50)
      .set('cql_filter', `INTERSECTS(geom, POINT(${lat} ${lon}))`)
      .set('outputFormat', 'application/json');
    
    const options = {
      header,
      params,
      responseType: 'text' as 'text'
    };

    return this.http.request('GET', this.urlCadastralBuildings, options).toPromise();
  }
}
