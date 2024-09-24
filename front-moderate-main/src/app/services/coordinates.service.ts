import { Injectable } from '@angular/core';


@Injectable({
  providedIn: 'root'
})

export class CoordinatesService {

  // private coordinatesSubject = new Subject<{lat: number, lng: number}>();
  // selectedCoordinates$ = this.coordinatesSubject.asObservable();
  private coordinates: {lat: number, lng: number};

  constructor() { }

  setCoordinates(coordinates: {lat: number, lng: number}) {
    this.coordinates = coordinates;
  }

  getCoordinates() {
    return this.coordinates;
  }

  // sendCoordinates(coordinates: {lat: number, lng: number}) {
  //   this.coordinatesSubject.next(coordinates);
  // }

  // getCoordinates(coordinates: {lat: number, lng: number}) {
  //   this.coordinates = coordinates;
  //   console.log(this.coordinates);
  // }
}
