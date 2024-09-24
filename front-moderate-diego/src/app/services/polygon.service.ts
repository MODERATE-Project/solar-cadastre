import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class PolygonService {

  private polygon: any;

  constructor() { }

  setPolygon(polygon: any) {
    this.polygon = polygon;
  }

  getPolygon() {
    return this.polygon;
  }
}
