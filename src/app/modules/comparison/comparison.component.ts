import { Component, OnInit, OnDestroy } from '@angular/core';
import * as _ from 'lodash';
import { select, Store } from '@ngrx/store';
import * as fromApp from '../../store/app.reducer';
import { filter, map } from 'rxjs/operators';
import { ApplicationModel, StageItem, CategoryModel } from 'src/app/models';
import { AppConstants } from '@core/app.constants';
import { MultiSelectService } from '@services';
import { Subscription } from 'rxjs';
import * as ApplicationActions from '../../store/application/application.actions';
import * as ProductActions from '../../store/product/product.actions';
import * as CompareActions from '../../store/comparison/comparison.actions';
import { State } from '../../store/application/application.reducer';
@Component({
  selector: 'app-comparison',
  templateUrl: './comparison.component.html',
  styleUrls: ['./comparison.component.scss'],
})
export class ComparisonComponent implements OnInit, OnDestroy {
  private applicationSubscription: Subscription;
  private categoriesSubscription: Subscription;
  private compareApplicationSubscription: Subscription;
  public comparedApplications: ApplicationModel[] = [];
  public categoryList: CategoryModel[] = [];
  public additionalFeaturesList: CategoryModel[] = [];
  public additionalFeaturesNestedList: CategoryModel[] = [];

  constructor(
    private store: Store<fromApp.AppState>,
    private multiSelectService: MultiSelectService
  ) {}

  ngOnInit() {
    this.store.dispatch(new ApplicationActions.FetchApplications(false));
    this.store.dispatch(new ProductActions.FetchAllProducts());
    this.store.dispatch(new CompareActions.FetchCompareApplications());

    this.getComparedApplications();
    this.getCategories();
  }

  ngOnDestroy() {
    if (this.applicationSubscription) {
      this.applicationSubscription.unsubscribe();
    }

    if (this.compareApplicationSubscription) {
      this.compareApplicationSubscription.unsubscribe();
    }

    if (this.categoriesSubscription) {
      this.categoriesSubscription.unsubscribe();
    }
  }

  getComparedApplications() {
    this.applicationSubscription = this.store
      .select('applications')
      .pipe(
        filter(
          (applicationState: State) => applicationState.allApplicationsLoaded
        ),
        map((applicationState: State) => applicationState.applications)
      )
      .subscribe((applications: ApplicationModel[]) => {
        if (applications.length > 0) {
          this.compareApplicationSubscription = this.store
            .select('compareApplications')
            .pipe(map((compareStore) => compareStore.compareApplications))
            .subscribe((compareApplications: number[]) => {
              this.comparedApplications = _.compact(
                _.map(compareApplications, (id: number) => {
                  const findedApplication = applications.find(
                    (application) => application.id === id
                  );

                  return findedApplication ? findedApplication : null;
                })
              );
            });
        }
      });
  }

  getCategories() {
    this.categoriesSubscription = this.store.select('categories')
      .pipe(map((categoryState) => categoryState.categories))
      .subscribe((categories: CategoryModel[]) => {
        this.categoryList = categories;

        // GET ADDITIONAL_FEATURES
        const ADDITIONAL_FEATURES = AppConstants.MainCategoryNames.ADDITIONAL_FEATURES;
        let additionalFeaturesParent = categories
          .find((item) => (item.title === ADDITIONAL_FEATURES.title && item.level === ADDITIONAL_FEATURES.level) );
        
        if (additionalFeaturesParent) {
          this.additionalFeaturesList = this.multiSelectService.getDropdownById(
            categories,
            additionalFeaturesParent.id
          );

          let thirdLevelList = this.additionalFeaturesList.map(item => {
            return this.multiSelectService.getDropdownById(categories, item.id);
          });

          thirdLevelList.map(arr => this.additionalFeaturesNestedList.push(...arr) );
        }
      });
  }

  getAdditionalFeaturesByIdList(ids: number[]): CategoryModel[] {
    let nestedCategories = ids
      .map(id => this.additionalFeaturesNestedList.find(item => item.id === id) )
      .filter((item) => item);

    if (!nestedCategories.length) { return []; }

    return this.additionalFeaturesList
      .map(parent => {
        let found = nestedCategories.find(nested => nested.parent_id === parent.id);
        return (found) ? parent : null;
      })
      .filter((item) => (item) ? item : false);
  }

  getAdditionalFeaturesNestedList(parentId: number, ids: number[]): CategoryModel[] {
    let nestedCategories = ids
      .map(id => this.additionalFeaturesNestedList.find(item => item.id === id) )
      .filter((item) => item);

    if (!nestedCategories.length) { return []; }

    return nestedCategories.filter(item => item.parent_id === parentId);
  }

  getApplicationTypeInfo(categoryId: number): CategoryModel {
    return this.categoryList.find(category => category.id === categoryId);
  }

  getStageInfo(stageId: number): StageItem {
    return AppConstants.StageItemList.find((item) => (item.id === stageId));
  }

  deleteCompareApplication(applicationId, index) {
    _.pullAt(this.comparedApplications, index);
    this.store.dispatch(
      new CompareActions.DeleteCompareApplication(applicationId)
    );
  }
}
