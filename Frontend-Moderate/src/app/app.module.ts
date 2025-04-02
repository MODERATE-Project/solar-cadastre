import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { HttpClientModule } from '@angular/common/http';
import { FormsModule } from '@angular/forms';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { MapComponent } from './components/map/map.component';
import { BuildingsService } from './services/buildings.service';
import { CoordinatesService } from './services/coordinates.service';
import { NgxChartsModule } from '@swimlane/ngx-charts';
import { CalculateDataComponent } from './components/calculate-data/calculate-data.component';
import { TablesComponent } from './components/tables/tables.component';
import { ShowTablesDirective } from './directives/show-tables.directive';
import { ShowCalculationsDirective } from './directives/show-calculations.directive';
import { TableSumComponent } from './components/table-sum/table-sum.component';
import { NgSelectModule } from '@ng-select/ng-select';
import { CommonModule } from '@angular/common';
import { SolarPotentialComponent } from './components/solar-potential/solar-potential.component';
import { ExistingSystemComponent } from './components/existing-system/existing-system.component';
import { HeaderComponent } from './components/header/header.component';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { HomeComponent } from './components/home/home.component'

@NgModule({
  declarations: [
    AppComponent,
    MapComponent,
    CalculateDataComponent,
    TablesComponent,
    ShowTablesDirective,
    ShowCalculationsDirective,
    TableSumComponent,
    SolarPotentialComponent,
    ExistingSystemComponent,
    HeaderComponent,
    HomeComponent,
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    HttpClientModule,
    NgxChartsModule,
    NgSelectModule,
    BrowserAnimationsModule,
    FormsModule
  ],
  providers: [BuildingsService, CoordinatesService],
  bootstrap: [AppComponent]
})
export class AppModule { }
