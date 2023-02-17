import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { Actions, Effect, ofType } from '@ngrx/effects';
import { Store } from '@ngrx/store';
import { switchMap, map, tap, catchError } from 'rxjs/operators';
import { CategoryModel } from '../../models/Category';
import { environment } from '../../../environments/environment';

import * as fromApp from '../app.reducer';
import * as CategoryActions from './category.actions';

@Injectable()
export class CategoryEffects {
  private url = environment.url;

  @Effect()
  fetchRecipes = this.actions$.pipe(
    ofType(CategoryActions.FETCH_CATEGORIES),
    switchMap(() => {
      return this.http.get<CategoryModel[]>(this.url + '/api/v1/category');
    }),
    map((categories) => {
      return new CategoryActions.SetCategories(categories);
    })
  );

  constructor(
    private actions$: Actions,
    private http: HttpClient,
    private router: Router,
    private store: Store<fromApp.AppState>
  ) {}
}
