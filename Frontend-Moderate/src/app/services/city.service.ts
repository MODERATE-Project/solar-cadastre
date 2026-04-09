import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class CityService {

  selectedCity: string = '';

  selectedAddress: string = '';

  constructor() { }
}
