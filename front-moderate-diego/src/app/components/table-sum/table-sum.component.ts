import { Component, Input, OnInit} from '@angular/core';

@Component({
  selector: 'app-table-sum',
  templateUrl: './table-sum.component.html',
  styleUrls: ['./table-sum.component.scss']
})

export class TableSumComponent implements OnInit {

  @Input() totalData: any = null;

  constructor() { };

  ngOnInit(): void {}

}