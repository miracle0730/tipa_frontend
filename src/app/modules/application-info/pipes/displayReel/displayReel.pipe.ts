import { Pipe, PipeTransform } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Store } from '@ngrx/store';
import * as fromApp from '@store/app.reducer';

@Pipe({
  name: 'displayReel',
})
export class DisplayReelPipe implements PipeTransform {
  constructor(private store: Store<fromApp.AppState>) {}

  transform(value: number[], args?: any): Observable<string> {
    return this.store.select('categories').pipe(
      map((categoryState) => {
        const applicationType = categoryState.categories.find(
          (category) => category.id === value[0]
        );

        const application = applicationType
          ? categoryState.categories.find(
              (category) => category.id === applicationType.parent_id
            )
          : null;
        return application ? application.title : '';
      })
    );
  }
}
