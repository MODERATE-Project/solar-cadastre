import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TableSumComponent } from './table-sum.component';

describe('TableSumComponent', () => {
  let component: TableSumComponent;
  let fixture: ComponentFixture<TableSumComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [TableSumComponent]
    });
    fixture = TestBed.createComponent(TableSumComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
