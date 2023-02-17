import {Injectable} from '@angular/core';
import {HttpClient, HttpHeaders} from '@angular/common/http';
import {environment} from '../../../../environments/environment';
import {CategoryModel, MainCategoryNamesItemModel} from '@models';

@Injectable({
  providedIn: 'root',
})
export class CategoryService {
  private url = environment.url;

  constructor(private http: HttpClient) {
  }

  /**
   * Gets categories
   * @returns  categories
   */
  getCategories() {
    return this.http.get(this.url + '/api/v1/category');
  }

  /**
   * Adds category
   * @param body body for creating category
   * @returns category
   */
  addCategory(body) {
    return this.http.post(this.url + '/api/v1/category', body);
  }

  /**
   * Edits category
   * @param categoryId id for updated category
   * @param body body for updating category
   * @returns  category
   */
  editCategory(categoryId: number, body) {
    return this.http.put(`${this.url}/api/v1/category/${categoryId}`, body);
  }

  /**
   * Deletes category
   * @param categoryId id of category
   * @returns true of false
   */
  deleteCategory(categoryId) {
    const headers = new HttpHeaders().set(
      'Content-Type',
      'text/plain; charset=utf-8'
    );
    return this.http.delete(`${this.url}/api/v1/category/${categoryId}`, {
      headers,
      responseType: 'text',
    });
  }

  getCategoryById(categories: CategoryModel[], id: number): CategoryModel {
    return (
      categories.find((category: CategoryModel) => category.id === id) || null
    );
  }

  getParentCategory(
    categories: CategoryModel[],
    parentId: number
  ): CategoryModel {
    return (
      categories.find((category: CategoryModel) => category.id === parentId) ||
      null
    );
  }

  getApplicationTypeById(categories: CategoryModel[], id: number) {
    const applicationType = categories.find((category) => category.id === id);

    const application = applicationType
      ? categories.find((category) => category.id === applicationType.parent_id)
      : null;

    return application ? application.title : null;
  }

  getMainCategoryBySubCategory(categoryList: CategoryModel[], category: CategoryModel): CategoryModel {
    if (!category || !category?.level) {
      return null;
    } else if (category?.level === 1) {
      return category;
    } else {
      let parentCategory: CategoryModel = categoryList.find(item => item?.id === category?.parent_id);
      return this.getMainCategoryBySubCategory(categoryList, parentCategory);
    }
  }

  getEqualityMainCategory(mainCategory: CategoryModel, mainCategoryNamesItem: MainCategoryNamesItemModel): boolean {
    return (mainCategory && mainCategory?.title === mainCategoryNamesItem?.title && mainCategory?.level === mainCategoryNamesItem?.level);
  }
}
