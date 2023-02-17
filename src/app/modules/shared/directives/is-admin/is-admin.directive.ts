import { Directive, OnInit, ElementRef, Renderer2 } from '@angular/core';
import { Store } from '@ngrx/store';
import { map } from 'rxjs/operators';
import { ProfileModel } from '@models';
import { AppRoles } from '../../../../core/app.roles';

import * as fromApp from '@store/app.reducer';
@Directive({
  selector: '[appIsAdmin]',
})
export class IsAdminDirective implements OnInit {
  constructor(
    private elRef: ElementRef,
    private renderer: Renderer2,
    private store: Store<fromApp.AppState>
  ) {}

  ngOnInit() {
    this.store
      .select('profile')
      .pipe(map((profileState) => profileState.profile))
      .subscribe((profile: ProfileModel) => {
        if (profile) {
          if (profile.role === AppRoles.Sales || profile.role === AppRoles.Commercial) {
            this.renderer.setStyle(this.elRef.nativeElement, 'display', 'none');
          } else {
            this.renderer.setStyle(this.elRef.nativeElement, 'display', 'flex');
          }
        }
      });
  }
}
