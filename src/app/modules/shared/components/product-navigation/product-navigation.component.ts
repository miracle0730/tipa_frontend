import { Component, OnInit, Input, OnDestroy } from '@angular/core';
import { Subscription } from 'rxjs';
import { map } from 'rxjs/operators';
import { CategoryModel } from '@models';

import { Store } from '@ngrx/store';
import * as fromApp from '@store/app.reducer';

@Component({
  selector: 'app-product-navigation',
  templateUrl: './product-navigation.component.html',
  styleUrls: ['./product-navigation.component.scss'],
})
export class ProductNavigationComponent implements OnInit, OnDestroy {
  @Input() currentProduct: string;

  private categoriesSubscription: Subscription;
  public category: CategoryModel;
  public parentCategory: CategoryModel;
  constructor(private store: Store<fromApp.AppState>) {}

  ngOnInit() {
    this.categoriesSubscription = this.store
      .select('categories')
      .pipe(map((categoryState) => categoryState.categories))
      .subscribe((categories: CategoryModel[]) => {
        const activeCategory = +localStorage.getItem('activeCategory');
        this.category = categories.find(
          (item: CategoryModel) => item.id === activeCategory
        );
        this.parentCategory = categories.find(
          (item: CategoryModel) => item.id === this.category.parent_id
        );
      });
  }

  ngOnDestroy() {
    if (this.categoriesSubscription) {
      this.categoriesSubscription.unsubscribe();
    }
  }
}
