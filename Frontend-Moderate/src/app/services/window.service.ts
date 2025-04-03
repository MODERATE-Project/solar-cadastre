import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class WindowService {
  private windowState = new BehaviorSubject<number>(0); // Default window state
  currentWindow = this.windowState.asObservable();

  private visibleLinkState = new BehaviorSubject<boolean>(false); // Default visibleLink state
  currentVisibleLink = this.visibleLinkState.asObservable();

  constructor() { }

  changeWindow(window: number) {
    this.windowState.next(window);
  }

  changeVisibleLink(visibleLink: boolean) {
    this.visibleLinkState.next(visibleLink);
  }
}