import { Pipe, PipeTransform } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Store } from '@ngrx/store';
import * as fromApp from '@store/app.reducer';

@Pipe({
  name: 'displayCategoryById',
})
export class DisplayCategoryByIdPipe implements PipeTransform {
  constructor(private store: Store<fromApp.AppState>) {}

  transform(value: number[], args?: any): Observable<string> {
    return this.store.select('categories').pipe(
      map((categoryState) => {
        const currentCategory = categoryState.categories.find(
          (category) => category.id === value[0]
        );
        return currentCategory ? currentCategory.title : '';
      })
    );
  }
}
