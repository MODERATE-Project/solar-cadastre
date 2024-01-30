import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { HttpClientModule } from '@angular/common/http';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { MapComponent } from './components/map/map.component';
import { BuildingsService } from './services/buildings.service';
import { NgxChartsModule } from '@swimlane/ngx-charts';


@NgModule({
  declarations: [
    AppComponent,
    MapComponent,
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    HttpClientModule,
    NgxChartsModule
  ],
  providers: [BuildingsService],
  bootstrap: [AppComponent]
})
export class AppModule { }
