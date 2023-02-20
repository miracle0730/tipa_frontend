import {Component, OnInit} from '@angular/core';
import {map} from 'rxjs/operators';
import {CategoryModel, ThicknessModel} from '@models';
import {BsModalService} from 'ngx-bootstrap/modal';
import {
  AddCategoryComponent,
  EditCategoryComponent,
  DeleteCategoryComponent,
  ModalCategoryCertificatesComponent,
  ModalCategoryCertifiedByComponent, ModalPartnersComponent,
} from './modals';
import { isShowTrack } from '@store/category/category.actions';

import {AppConstants} from '@core/app.constants';

import {Store} from '@ngrx/store';
import * as fromApp from '@store/app.reducer';
import * as _ from 'lodash';
import {Observable} from 'rxjs';

export interface TreeCategory {
  id: number;
  parent_id: number;
  level: number;
  title: string;
  createdAt: string;
  updatedAt: string;
  nestedCategories: TreeCategory[];
  collapsed: boolean;
}

export interface ThicknessTreeModel {
  nestedThickness: ThicknessModel[];
  title: string;
  collapsed: boolean;
}

import {ThicknessService, CategoryService} from '@services';
import * as ThicknessActions from '@store/thickness/thickness.actions';

@Component({
  selector: 'app-categories',
  templateUrl: './categories.component.html',
  styleUrls: ['./categories.component.scss'],
})
export class CategoriesComponent implements OnInit {
  public categoryTree: Observable<TreeCategory[]>;
  public thicknessTree$: Observable<ThicknessTreeModel>;
  public mainCategoryNames = AppConstants.MainCategoryNames;
  public categories: CategoryModel[] = [];
  public isShowFastTrack: boolean;
  public fastTrackValue: string;

  constructor(
    private store: Store<fromApp.AppState>,
    private modalService: BsModalService,
    private thicknessService: ThicknessService,
    private categoryService: CategoryService,
  ) {
  }

  ngOnInit() {
    this.store.dispatch(new ThicknessActions.FetchThickness());

    this.thicknessTree$ = this.store.select('thickness').pipe(
      map((thicknessState) => thicknessState.thickness),
      map((thicknessArray) => {
        return {
          nestedThickness: [...thicknessArray],
          title: 'Thickness',
          collapsed: true
        };
      })
    );

    this.categoryTree = this.store.select('categories').pipe(
      map((categoryState) => {
        console.log(categoryState);
        this.categories = _.cloneDeep(categoryState.categories);
        this.isShowFastTrack = categoryState.isShowFastTrack;
        this.fastTrackValue = this.isShowFastTrack ? "Hide fast track" : "Show fast track";
        return this.transformCategoriesToSideMenu(categoryState.categories);
      }),
      map((sideMenuArray: TreeCategory[]) => {
        return this.transformCategoriesArrayToTree(sideMenuArray);
      })
    );

    console.log("thicknessTree: ", this.thicknessTree$);
    console.log("categoryTree: ", this.categoryTree);
  }

  /**
   * Transforms categories for side menu
   * @param categories array of category
   * @returns categories with active item for side menu
   */
  transformCategoriesToSideMenu(categories: CategoryModel[]): TreeCategory[] {
    return categories.map((category: CategoryModel) => ({
      ...category,
      nestedCategories: [],
      collapsed: category.level < 2,
    }));
  }

  /**
   * Transforms categories array to tree
   * @param array global categories array
   * @returns sorted category tree of categories
   */
  private transformCategoriesArrayToTree(array: TreeCategory[]) {
    const itemNode = {};

    return _.sortBy(
      _.filter(_.cloneDeep(array), (location: TreeCategory) => {
        const locationId = location.id;
        const parentId = location.parent_id;

        itemNode[locationId] = _.defaults(location, itemNode[locationId], {
          nestedCategories: [],
        });

        (itemNode[parentId] = itemNode[parentId] || {nestedCategories: []}).nestedCategories.push(location);

        return !parentId;
      }),
      (item: TreeCategory) => item.id
    );
  }

  showForMainCategory(mainCategory: CategoryModel): boolean {
    const showAdditionalFeatures: boolean = (mainCategory.title === this.mainCategoryNames.ADDITIONAL_FEATURES.title && mainCategory.level === this.mainCategoryNames.ADDITIONAL_FEATURES.level);
    const showCompostabilityLogos: boolean = (mainCategory.title === this.mainCategoryNames.COMPOSTABILITY_LOGOS.title && mainCategory.level === this.mainCategoryNames.COMPOSTABILITY_LOGOS.level);

    return showAdditionalFeatures || showCompostabilityLogos;
  }

  getOpenDifferentModalCategory(categoryData: CategoryModel): boolean {
    if (!categoryData) {
      return false;
    }

    const mainCategory: CategoryModel = this.categoryService.getMainCategoryBySubCategory(this.categories, categoryData);
    const isMainCategoryCertificates: boolean = this.categoryService.getEqualityMainCategory(mainCategory, AppConstants.MainCategoryNames.CERTIFICATES);
    const isMainCategoryCertifiedBy: boolean = this.categoryService.getEqualityMainCategory(mainCategory, AppConstants.MainCategoryNames.CERTIFIED_BY);
    const isPartners: boolean = this.categoryService.getEqualityMainCategory(mainCategory, AppConstants.MainCategoryNames.PARTNERS);

    return (isMainCategoryCertificates || isMainCategoryCertifiedBy || isPartners);
  }

  openDifferentModalCategory(categoryData: CategoryModel) {
    const mainCategory: CategoryModel = this.categoryService.getMainCategoryBySubCategory(this.categories, categoryData);
    if (!categoryData || !mainCategory) {
      return false;
    }

    const config = {
      class: 'modal-md modal-dialog-centered',
      initialState: {
        categoryData,
      },
    };

    if (this.categoryService.getEqualityMainCategory(mainCategory, AppConstants.MainCategoryNames.CERTIFICATES)) {
      this.modalService.show(ModalCategoryCertificatesComponent, config);
    } else if (this.categoryService.getEqualityMainCategory(mainCategory, AppConstants.MainCategoryNames.CERTIFIED_BY)) {
      this.modalService.show(ModalCategoryCertifiedByComponent, config);
    } else if (this.categoryService.getEqualityMainCategory(mainCategory, AppConstants.MainCategoryNames.PARTNERS)) {
      this.modalService.show(ModalPartnersComponent, config);
    } else {
      return false;
    }
  }

  addCategory(status: string, parentCategory?: CategoryModel) {
    let parentCategoryInfo;
    switch (status.toLowerCase()) {
      case 'Category'.toLowerCase():
        parentCategoryInfo = { // parentCategory
          parent_id: parentCategory.id,
          level: parentCategory.level + 1,
        };
        break;
      case 'Thickness'.toLowerCase():
        parentCategoryInfo = null;
        break;
      default:
        parentCategoryInfo = null;
        console.error('Status (Category | Thickness) is not a match !!!');
        return false;
    }

    const categoryData: CategoryModel = {
      id: null,
      parent_id: parentCategoryInfo?.parent_id || null,
      level: parentCategoryInfo?.level || null,
      title: null,
      createdAt: null,
      updatedAt: null,
      metadata: null,
    };

    // Different modals for categories
    if (this.getOpenDifferentModalCategory(categoryData)) {
      this.openDifferentModalCategory(categoryData);
    } else {
      const config = {
        class: 'modal-md modal-dialog-centered',
        initialState: {
          initialState: { // Important
            status, // Category | Thickness
            elementInfo: {
              ...parentCategoryInfo
            }
          }
        },
      };
      this.modalService.show(AddCategoryComponent, config);
    }
  }

  editCategory(status: string, item: CategoryModel | ThicknessModel) {
    let itemId;
    let itemTitle;

    switch (status.toLowerCase()) {
      case 'Category'.toLowerCase():
        itemId = item.id;
        if ('title' in item) {
          itemTitle = item.title;
        }
        break;
      case 'Thickness'.toLowerCase():
        itemId = item.id;
        if ('title' in item) {
          itemTitle = item.title;
        }
        break;
      default:
        console.error('Status (Category | Thickness) is not a match !!!');
        return false;
    }
    // Different modals for categories
    if (this.getOpenDifferentModalCategory((item as CategoryModel))) {
      this.openDifferentModalCategory((item as CategoryModel));
    } else {
      const config = {
        class: 'modal-md modal-dialog-centered',
        initialState: {
          status, // Important -> Category | Thickness
          item,
          itemId,
          itemTitle,
        },
      };
      this.modalService.show(EditCategoryComponent, config);
    }
  }

  deleteCategory(status: string, item: CategoryModel | ThicknessModel) {
    const itemInfo = {
      id: item.id,
      title: ''
    };

    switch (status.toLowerCase()) {
      case 'Category'.toLowerCase():
        if ('title' in item) {
          itemInfo.title = item.title;
        }
        break;
      case 'Thickness'.toLowerCase():
        if ('value' in item) {
          itemInfo.title = item.value.toString();
        }
        break;
      default:
        console.error('Status (Category | Thickness) is not a match !!!');
        return false;
    }

    const config = {
      class: 'modal-md modal-dialog-centered',
      initialState: {
        status, // Important -> Category | Thickness
        itemInfo,
      },
    };
    this.modalService.show(DeleteCategoryComponent, config);
  }

  isActiveFastTrack() {
    this.isShowFastTrack = !this.isShowFastTrack;
    this.fastTrackValue = this.isShowFastTrack ? "Hide fast track" : "Show fast track";
    this.store.dispatch(new isShowTrack(this.isShowFastTrack));
  }
}
