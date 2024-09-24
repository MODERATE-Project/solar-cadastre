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

  totalData = {"area_conv" : 0, "nom_power" : 0, "potential" : 0, "av_yield" : 0, "co2" : 0} ;
  constructor(private polygonService: PolygonService, private buildingServices: BuildingsService, private renderer: Renderer2) { };

  ngOnInit(): void {
    this.polygon = this.polygonService.getPolygon();
    this.showTableSum();
  }

  showTableSum() {
    this.buildingServices.getBuildingsFeaturePolygon(this.polygon).then((data) => {
      const featureList = JSON.parse(data).features;
      console.log(featureList);
      for (let feature of featureList) {
        this.totalData.area_conv += feature.properties.area_convi;
        this.totalData.nom_power += feature.properties.pv_nominal;
        this.totalData.potential += feature.properties.potential_;
        this.totalData.av_yield += feature.properties.average_yi;
        this.totalData.co2 += feature.properties.potentialc;
      }
      console.log(this.totalData);
    })
  }

}
