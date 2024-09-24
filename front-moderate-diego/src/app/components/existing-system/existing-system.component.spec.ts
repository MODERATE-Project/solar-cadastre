import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ExistingSystemComponent } from './existing-system.component';

describe('ExistingSystemComponent', () => {
  let component: ExistingSystemComponent;
  let fixture: ComponentFixture<ExistingSystemComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [ExistingSystemComponent]
    });
    fixture = TestBed.createComponent(ExistingSystemComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
