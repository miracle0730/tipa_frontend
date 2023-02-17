import { Injectable } from '@angular/core';
import { Actions, Effect, ofType } from '@ngrx/effects';
import { switchMap, map, tap, catchError } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

import { ThicknessService } from '@core/services/thickness/thickness.service';
import * as ThicknessActions from './thickness.actions';

@Injectable()
export class ThicknessEffects {
  private url = environment.url;

  @Effect()
  fetchRecipes = this.actions$.pipe(
    ofType(ThicknessActions.FETCH_THICKNESS),
    switchMap(() => {
      return this.thicknessService.getThickness();
    }),
    map((thickness) => {
      return new ThicknessActions.SetThickness(thickness);
    })
  );

  constructor(
    private actions$: Actions,
    private thicknessService: ThicknessService
  ) {}
}
