import { Pipe, PipeTransform } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Store } from '@ngrx/store';
import * as fromApp from '@store/app.reducer';

@Pipe({
  name: 'getPacketGoods',
})
export class GetPacketGoodsPipe implements PipeTransform {
  constructor(private store: Store<fromApp.AppState>) {}

  transform(value: number[], args?: any): Observable<string> {
    return this.store.select('categories').pipe(
      map((categoryState) => {
        const categories = categoryState.categories;
        return value.map((id: number) => {
          const packetGood = categories.find((category) => category.id === id);
          return packetGood ? packetGood.title : '';
        }).join(', ');
      })
    );
  }
}
