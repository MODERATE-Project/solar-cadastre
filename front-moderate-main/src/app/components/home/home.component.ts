import { Component } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class HomeComponent {

  selectedCity: string = '';
  showWarning: boolean = false;

  constructor(private router: Router){

  }

  goToMap(){
    if (this.selectedCity) {
      //this.router.navigate(['/map'], { queryParams: { city: this.selectedCity } });
      this.router.navigate(['/map']);
      this.showWarning = false;
    }else{
      this.showWarning = true;
    }
  }
}
