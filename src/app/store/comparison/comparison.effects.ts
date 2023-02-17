import { Injectable } from '@angular/core';
import { Actions, Effect, ofType } from '@ngrx/effects';
import { map } from 'rxjs/operators';
import * as _ from 'lodash';
import * as ComparisonActions from './comparison.actions';

@Injectable()
export class ComparisonEffects {
  @Effect()
  fetchCompareApplications = this.actions$.pipe(
    ofType(ComparisonActions.FETCH_COMPARE_APPLICATIONS),
    map(() => {
      const prevInfo = localStorage.getItem('compareApplications')
        ? JSON.parse(localStorage.getItem('compareApplications'))
        : null;
      if (_.isArray(prevInfo)) {
        return new ComparisonActions.SetCompareApplications(_.uniq(prevInfo));
      } else {
        return new ComparisonActions.SetCompareApplications([]);
      }
    })
  );

  constructor(private actions$: Actions) {}
}
