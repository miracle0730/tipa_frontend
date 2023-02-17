import { Pipe, PipeTransform } from '@angular/core';
import { map } from 'rxjs/operators';
import { Observable } from 'rxjs';
import { Store } from '@ngrx/store';
import * as fromApp from '@store/app.reducer';
@Pipe({
  name: 'getProduct',
})
export class GetProductPipe implements PipeTransform {
  constructor(private store: Store<fromApp.AppState>) {}

  transform(value: number[], args?: any): Observable<string> {
    return this.store.select('products').pipe(
      map((productState) => {
        const currentProduct = productState.allProducts.find(
          (product) => product.id === value[0]
        );
        return currentProduct ? currentProduct.title : '';
      })
    );
  }
}
