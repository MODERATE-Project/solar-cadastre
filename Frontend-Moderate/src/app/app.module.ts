import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { HttpClientModule } from '@angular/common/http';

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


@NgModule({
  declarations: [
    AppComponent,
    MapComponent,
    CalculateDataComponent,
    TablesComponent,
    ShowTablesDirective,
    ShowCalculationsDirective,
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    HttpClientModule,
    NgxChartsModule
  ],
  providers: [BuildingsService, CoordinatesService],
  bootstrap: [AppComponent]
})
export class AppModule { }
