import { Injectable } from '@angular/core';
import {
  CanActivate,
  ActivatedRouteSnapshot,
  RouterStateSnapshot,
  Router,
} from '@angular/router';
import { Observable } from 'rxjs';
import { Store } from '@ngrx/store';
import { AppRoles } from '../app.roles';
import { map, filter } from 'rxjs/operators';
import * as ProfileActions from '@store/profile/profile.actions';
import * as fromApp from '@store/app.reducer';
@Injectable({ providedIn: 'root' })
export class IsAdminGuard implements CanActivate {
  constructor(private router: Router, private store: Store<fromApp.AppState>) {}

  canActivate(
    next: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): Observable<boolean> | Promise<boolean> | boolean {
    this.store.dispatch(new ProfileActions.FetchProfile());

    return this.store.select('profile').pipe(
      filter((profileState) => profileState.profileLoaded),
      map((profileState) => {
        if (profileState.profile.role === AppRoles.Sales) {
          this.router.navigate(['/products']);
          return false;
        } else {
          return true;
        }
      })
    );
  }
}
