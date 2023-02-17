import { Injectable } from '@angular/core';
import { CategoryModel, MultiSelectModel } from 'src/app/models';
import * as _ from 'lodash';

@Injectable({
  providedIn: 'root',
})
export class MultiSelectService {
  constructor() {}

  /**
   * Transforms select data
   * @param reels selected values from select
   * @returns array of category ids
   */
  transformSelectData(reels: MultiSelectModel[]) {
    return reels.map((reel) => reel.id);
  }
  /**
   * Preselects reels
   * @param ids ids of reel from backend side
   * @param categories array of categories
   * @returns list of categories for preselecting in multi select
   */
  preselectOptions(ids: number[], categories: CategoryModel[]) {
    return categories.filter((category: CategoryModel) =>
      ids.includes(category.id)
    );
  }

  /**
   * Gets dropdown by title
   * @param categories array of categories
   * @param title title of category
   * @returns filtered categories
   */
  getDropdownByTitle(categories: CategoryModel[], title: string) {
    const applicationCategory = categories.find(
      (category: CategoryModel) => category.title === title
    );

    return categories.filter((category: CategoryModel) => {
      return category.parent_id === applicationCategory.id;
    });
  }

  getDropdownById(categories: CategoryModel[], id: number) {
    const applicationCategory = categories.find(
      (category: CategoryModel) => category.id === id
    );

    return categories.filter((category: CategoryModel) => {
      return category.parent_id === applicationCategory.id;
    });
  }

  getDropdownByArray(categories: CategoryModel[], ids: number[]) {
    return ids.length > 0
      ? _.flattenDeep(_.map(ids, (id) => this.getDropdownById(categories, id)))
      : [];
  }
}
