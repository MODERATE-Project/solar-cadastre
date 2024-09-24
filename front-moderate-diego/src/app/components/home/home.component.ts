import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { CityService } from 'src/app/services/city.service';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class HomeComponent {

  selectedCity: string = '';
  showWarning: boolean = false;

  constructor(private router: Router, private cityService: CityService){

  }

  goToMap(){
    if (this.selectedCity) {
      //this.router.navigate(['/map'], { queryParams: { city: this.selectedCity } });
      this.cityService.selectedCity = this.selectedCity;
      this.router.navigate(['/map']);
      this.showWarning = false;
    }else{
      this.showWarning = true;
    }
  }
}
