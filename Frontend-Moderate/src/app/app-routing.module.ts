import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { CalculateDataComponent } from './components/calculate-data/calculate-data.component';
import { TablesComponent } from './components/tables/tables.component';

const routes: Routes = [{path: "calculate", component: CalculateDataComponent}, {path: "tables", component: TablesComponent}];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})

export class AppRoutingModule { }
