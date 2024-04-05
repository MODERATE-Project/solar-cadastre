import { Component, OnInit, Renderer2 } from '@angular/core';
import { PolygonService } from 'src/app/services/polygon.service';
import { BuildingsService } from 'src/app/services/buildings.service';

@Component({
  selector: 'app-table-sum',
  templateUrl: './table-sum.component.html',
  styleUrls: ['./table-sum.component.scss']
})

export class TableSumComponent implements OnInit {

  polygon: number[][];

  constructor(private polygonService: PolygonService, private buildingServices: BuildingsService, private renderer: Renderer2) { };

  ngOnInit(): void {
    this.polygon = this.polygonService.getPolygon();
    this.showTableSum();
  }

  showTableSum() {
    let totalData = {"area_conv" : 0, "nom_power" : 0, "potential" : 0, "av_yield" : 0, "co2" : 0} ;
    this.buildingServices.getBuildingsFeaturePolygon(this.polygon).then((data) => {
      const featureList = JSON.parse(data).features;
      console.log(featureList);
      for (let feature of featureList) {
        totalData.area_conv += feature.properties.area_convi;
        totalData.nom_power += feature.properties.pv_nominal;
        totalData.potential += feature.properties.potential_;
        totalData.av_yield += feature.properties.average_yi;
        totalData.co2 += feature.properties.potentialc;
      }
      console.log(totalData);
      const datosContainer = document.getElementById('tabla');
      this.renderer.setProperty(datosContainer, 'innerHTML', `
        <h5 style="font-weight: 700; color: #0D5D93">Selected area information</h5>
        <div class="container">
          <div class="row">
            <div class="col-sm">
                <p style="font-weight: 400; color: #052D65"; opacity: 0.6>Sum of area convinient for PV</p>
                <h5 style="font-weight: 700; color: #051B39">${totalData.area_conv.toFixed(2)} m<sup>2</sup></h5>
            </div>
            <div class="col-sm">
              <p style="font-weight: 400; color: #052D65"; opacity: 0.6>Sum of PV nominal power convinient for PV</p>
              <h5 style="font-weight: 700; color: #051B39">${totalData.nom_power.toFixed(2)} kWp</h5>
            </div>
            <div class="col-sm">
              <p style="font-weight: 400; color: #052D65"; opacity: 0.6>Sum of potential PV energy</p>
              <h5 style="font-weight: 700; color: #051B39">${totalData.potential.toFixed(2)} kWh/year</h5>
            </div>
          </div>

          <div class="row">
            <div class="col-sm">
              <p style="font-weight: 400; color: #052D65"; opacity: 0.6>Average yield</p>
              <h5 style="font-weight: 700; color: #051B39">${totalData.av_yield.toFixed(2)} kWh/kWp</h5>
            </div>
            <div class="col-sm">
              <p style="font-weight: 400; color: #052D65"; opacity: 0.6>Sum of potential CO<sub>2</sub> emission reduction</p>
              <h5 style="font-weight: 700; color: #051B39">${totalData.co2.toFixed(2)} kgCO<sub>2</sub></h5>
            </div>
          </div>
        </div>
      `);
    })
  }

}
