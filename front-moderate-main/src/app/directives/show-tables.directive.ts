import { Directive, ViewContainerRef } from '@angular/core';

@Directive({
  selector: '[appShowTables]'
})
export class ShowTablesDirective {

  constructor(public viewContainerRef: ViewContainerRef) { }

}
