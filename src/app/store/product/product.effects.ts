import { Injectable } from '@angular/core';
import { Actions, Effect, ofType } from '@ngrx/effects';
import { Store } from '@ngrx/store';
import {
  switchMap,
  map,
  catchError,
  withLatestFrom,
  filter,
  exhaustMap,
} from 'rxjs/operators';

import * as ProductActions from './product.actions';
import { State } from './product.reducer';
import * as fromApp from '../app.reducer';
import { ProductModel } from 'src/app/models';
import { ProductService, AlertService } from 'src/app/core/services';
import { of } from 'rxjs';

@Injectable()
export class ProductEffects {
  @Effect()
  fetchAllProducts = this.actions$.pipe(
    ofType(ProductActions.FETCH_ALL_PRODUCTS),
    withLatestFrom(
      this.store
        .select('products')
        .pipe(map((productStore) => productStore.allProductsLoaded))
    ),
    filter(([_, loaded]) => !loaded),
    exhaustMap(() => {
      return this.productService.getProducts().pipe(
        map((products) => new ProductActions.SetAllProducts(products)),
        catchError((err) => {
          this.alertService.showError(err.error.message);
          this.store.dispatch(new ProductActions.ErrorProduct(err));
          return of({ type: 'Error' });
        })
      );
    })
  );

  @Effect()
  fetchProduct = this.actions$.pipe(
    ofType(ProductActions.FETCH_PRODUCT),
    withLatestFrom(this.store.select('products')),
    switchMap(([action, store]: [ProductActions.FetchProduct, State]) => {
      if (store.allProducts.length > 0) {
        const product = store.allProducts.find(
          (item) => item.id === action.payload
        );

        return of(new ProductActions.SetProduct(product));
      } else {
        return this.productService.getProductById(action.payload).pipe(
          map((result: ProductModel) => new ProductActions.SetProduct(result)),
          catchError((err) => {
            this.alertService.showError(err.error.message);
            this.store.dispatch(new ProductActions.ErrorProduct(err));
            return of({ type: 'Error' });
          })
        );
      }
    })
  );

  constructor(
    private actions$: Actions,
    private store: Store<fromApp.AppState>,
    private productService: ProductService,
    private alertService: AlertService
  ) {}
}
