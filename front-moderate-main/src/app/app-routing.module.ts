import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { CalculateDataComponent } from './components/calculate-data/calculate-data.component';
import { TablesComponent } from './components/tables/tables.component';
import { MapComponent } from './components/map/map.component';
import { SolarPotentialComponent } from './components/solar-potential/solar-potential.component';
import { HomeComponent } from './components/home/home.component';

const routes: Routes = [
  { path: 'map', component: MapComponent },
  { path: '', component: HomeComponent },
  { path: 'solar-potential', component: SolarPotentialComponent },
  {path: "calculate", component: CalculateDataComponent}, 
  {path: "tables", component: TablesComponent}
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})

export class AppRoutingModule { }
