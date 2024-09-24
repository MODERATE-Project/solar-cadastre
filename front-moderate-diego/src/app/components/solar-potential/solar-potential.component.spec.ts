import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SolarPotentialComponent } from './solar-potential.component';

describe('SolarPotentialComponent', () => {
  let component: SolarPotentialComponent;
  let fixture: ComponentFixture<SolarPotentialComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [SolarPotentialComponent]
    });
    fixture = TestBed.createComponent(SolarPotentialComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
