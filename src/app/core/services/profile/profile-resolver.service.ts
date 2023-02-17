import { Injectable } from '@angular/core';
import {
  Resolve,
  ActivatedRouteSnapshot,
  RouterStateSnapshot,
} from '@angular/router';
import { Store } from '@ngrx/store';
import { Actions, ofType } from '@ngrx/effects';
import { take, map, switchMap } from 'rxjs/operators';
import { of } from 'rxjs';

import * as fromApp from '@store/app.reducer';
import * as ProfileActions from '@store/profile/profile.actions';

import { ProfileModel } from 'src/app/models';

@Injectable({ providedIn: 'root' })
export class ProfileResolverService implements Resolve<ProfileModel> {
  constructor(
    private store: Store<fromApp.AppState>,
    private actions$: Actions
  ) {}

  resolve(route: ActivatedRouteSnapshot, state: RouterStateSnapshot) {
    return this.store.select('profile').pipe(
      take(1),
      map((profileState) => {
        return profileState.profile;
      }),
      switchMap((profile) => {
        if (!profile) {
          this.store.dispatch(new ProfileActions.FetchProfile());
          return this.actions$.pipe(
            ofType(ProfileActions.SET_PROFILE),
            take(1)
          );
        } else {
          return of(profile);
        }
      })
    );
  }
}
