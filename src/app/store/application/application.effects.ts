import { Injectable } from '@angular/core';
import { Actions, Effect, ofType } from '@ngrx/effects';
import { Store } from '@ngrx/store';
import { of } from 'rxjs';
import {
  map,
  catchError,
  withLatestFrom,
  filter,
  exhaustMap,
} from 'rxjs/operators';
import { ApplicationModel } from 'src/app/models';
import { ApplicationService, AlertService } from 'src/app/core/services';

import * as fromApp from '../app.reducer';
import * as ApplicationActions from './application.actions';
import { State } from './application.reducer';
import { switchMap } from 'rxjs/operators';

@Injectable()
export class ApplicationEffects {
  @Effect()
  fetchApplications = this.actions$.pipe(
    ofType(ApplicationActions.FETCH_APPLICATIONS),
    withLatestFrom(
      this.store
        .select('applications')
        .pipe(map((applicationStore) => applicationStore.allApplicationsLoaded))
    ),
    filter(
      ([action, loaded]: [ApplicationActions.FetchApplications, boolean]) => {
        if (action.payload) {
          return true;
        } else {
          return !loaded;
        }
      }
    ),
    exhaustMap(() =>
      this.applicationService.getApplications().pipe(
        map((result) => new ApplicationActions.SetApplications(result)),
        catchError((err) => {
          this.alertService.showError(err.error.message);
          this.store.dispatch(new ApplicationActions.ErrorApplication(err));
          return of({ type: 'Error' });
        })
      )
    )
  );

  @Effect()
  fetchApplication = this.actions$.pipe(
    ofType(ApplicationActions.FETCH_APPLICATION),
    withLatestFrom(this.store.select('applications')),
    switchMap(
      ([action, store]: [ApplicationActions.FetchApplication, State]) => {
        if (store.applications.length > 0) {
          const application = store.applications.find(
            (item) => item.id === action.payload
          );

          return of(new ApplicationActions.SetApplication(application));
        } else {
          return this.applicationService
            .getApplicationById(action.payload)
            .pipe(
              map(
                (result: ApplicationModel) =>
                  new ApplicationActions.SetApplication(result)
              ),
              catchError((err) => {
                this.alertService.showError(err.error.message);
                this.store.dispatch(
                  new ApplicationActions.ErrorApplication(err)
                );
                return of({ type: 'Error' });
              })
            );
        }
      }
    )
  );

  constructor(
    private actions$: Actions,
    private store: Store<fromApp.AppState>,
    private applicationService: ApplicationService,
    private alertService: AlertService
  ) {}
}
