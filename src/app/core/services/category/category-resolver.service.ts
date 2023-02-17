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
import * as CategoryActions from '@store/category/category.actions';
import { CategoryModel } from '../../../models/Category';

@Injectable({ providedIn: 'root' })
export class CategoryResolverService implements Resolve<CategoryModel[]> {
  constructor(
    private store: Store<fromApp.AppState>,
    private actions$: Actions
  ) {}

  resolve(route: ActivatedRouteSnapshot, state: RouterStateSnapshot) {
    return this.store.select('categories').pipe(
      take(1),
      map((categoryState) => {
        return categoryState.categories;
      }),
      switchMap((recipes) => {
        if (recipes.length === 0) {
          this.store.dispatch(new CategoryActions.FetchCategories());
          return this.actions$.pipe(
            ofType(CategoryActions.SET_CATEGORIES),
            take(1)
          );
        } else {
          return of(recipes);
        }
      })
    );
  }
}
