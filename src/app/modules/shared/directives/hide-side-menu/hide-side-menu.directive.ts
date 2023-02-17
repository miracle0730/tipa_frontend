import { Directive, OnInit, ElementRef, Renderer2 } from '@angular/core';
import { Store } from '@ngrx/store';

import * as fromApp from '@store/app.reducer';
import { map } from 'rxjs/operators';
@Directive({
  selector: '[appHideSideMenu]',
})
export class HideSideMenuDirective implements OnInit {
  constructor(
    private elRef: ElementRef,
    private renderer: Renderer2,
    private store: Store<fromApp.AppState>
  ) {}

  ngOnInit() {
    this.store
      .select('sideMenuHidden')
      .pipe(map((sideMenuStore) => sideMenuStore.sideMenuHidden))
      .subscribe((isSideMenuHidden: boolean) => {
        if (isSideMenuHidden) {
          this.renderer.removeClass(this.elRef.nativeElement, 'c-sidebar-show');
        } else {
          this.renderer.addClass(this.elRef.nativeElement, 'c-sidebar-show');
        }
      });
  }
}
