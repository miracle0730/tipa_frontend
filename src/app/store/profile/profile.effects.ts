import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { Actions, Effect, ofType } from '@ngrx/effects';
import { Store } from '@ngrx/store';
import { HttpClient } from '@angular/common/http';
import {
  switchMap,
  map,
  tap,
  catchError,
  exhaustMap,
  filter,
  withLatestFrom,
} from 'rxjs/operators';
import { ProfileModel } from 'src/app/models';
import { environment } from '../../../environments/environment';

import * as ProfileActions from './profile.actions';
import * as fromApp from '../app.reducer';
import { of } from 'rxjs';

@Injectable()
export class ProfileEffects {
  private url = environment.url;

  @Effect()
  fetchRecipes = this.actions$.pipe(
    ofType(ProfileActions.FETCH_PROFILE),
    withLatestFrom(
      this.store
        .select('profile')
        .pipe(map((profileStore) => profileStore.profileLoaded))
    ),
    filter(([_, loaded]) => !loaded),
    exhaustMap(() => {
      return this.http.get<ProfileModel>(this.url + '/api/v1/profile').pipe(
        map((profile) => new ProfileActions.SetProfile(profile)),
        catchError((err) => of({ type: 'error' }))
      );
    })
  );

  constructor(
    private actions$: Actions,
    private http: HttpClient,
    private router: Router,
    private store: Store<fromApp.AppState>
  ) {}
}
