import { Directive, ViewContainerRef } from '@angular/core';

@Directive({
  selector: '[appShowCalculations]'
})
export class ShowCalculationsDirective {

  constructor(public viewContainerRef: ViewContainerRef) { }

}
