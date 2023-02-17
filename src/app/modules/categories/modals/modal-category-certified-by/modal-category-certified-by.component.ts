import { Component, OnInit, OnDestroy } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { FormGroup, FormBuilder, FormControl, Validators, } from '@angular/forms';

// Services
import { AlertService, CategoryService, } from '@services';

// Models
import { CategoryModel, } from '@models';

// Constants
import { AppConstants } from '@core/app.constants';

// Redux
import { Store } from '@ngrx/store';
import * as fromApp from '@store/app.reducer';
import * as CategoryActions from '@store/category/category.actions';

// Libraries
import { BsModalRef } from 'ngx-bootstrap/modal';
import { Subscription } from 'rxjs';
import { map } from 'rxjs/operators';
import * as _ from 'lodash';

@Component({
  selector: 'app-modal-category-certified-by',
  templateUrl: './modal-category-certified-by.component.html',
  styleUrls: ['./modal-category-certified-by.component.scss']
})
export class ModalCategoryCertifiedByComponent implements OnInit, OnDestroy {
  public categoryData: CategoryModel; // Input variable

  public categoriesSubscription: Subscription;

  public categoryForm: FormGroup;
  public editCategory: boolean;
  public categories: CategoryModel[] = [];

  constructor(
    private store: Store<fromApp.AppState>,
    private bsModalRef: BsModalRef,
    private formBuilder: FormBuilder,
    private alertService: AlertService,
    private categoryService: CategoryService,
  ) {
    this.categoryForm = this.formBuilder.group({
      title: new FormControl('', Validators.required),
      metadata: new FormGroup({}), // metadata is dynamic
    });
  }

  ngOnInit(): void {
    this.getCategories();
  }

  ngOnDestroy() {
    if (this.categoriesSubscription) {
      this.categoriesSubscription.unsubscribe();
    }
  }

  get getMetadata() {
    return this.categoryForm.get('metadata') as FormGroup;
  }

  buildAndPreselectCategoryForm() {
    let mainCategory: CategoryModel = this.categoryService.getMainCategoryBySubCategory(this.categories, this.categoryData);
    let isMainCategoryCertifiedBy: boolean = this.categoryService.getEqualityMainCategory(mainCategory, AppConstants.MainCategoryNames.CERTIFIED_BY);

    // This modal only for all CERTIFIED_BY of certificates
    if (!this.categoryData || !isMainCategoryCertifiedBy) {
      setTimeout(() => { this.closeModal(); }, 0); // IMPORTANT setTimeout, because without setTimeout it doesn't work
      return false;
    }

    // Edit or New category
    if (this.categoryData?.id) { // Edit
      this.editCategory = true;
      this.categoryForm.get('title').setValue(this.categoryData?.title || '');
    } else { // New
      this.editCategory = false;
      this.categoryForm.addControl('parent_id', new FormControl(this.categoryData?.parent_id || null));
      this.categoryForm.addControl('level', new FormControl(this.categoryData?.level || null));
    }

    // Build and Preselect form by level
    let categoryLevel: number = this.categoryData?.level;
    if (categoryLevel === 2) {
      // certified_by_website
      let certifiedByWebsiteValue: string = this.categoryData?.metadata?.certified_by_website;
      let preselectCertifiedByWebsite: string = (certifiedByWebsiteValue && typeof certifiedByWebsiteValue === 'string') ? certifiedByWebsiteValue : '';
      this.getMetadata.addControl('certified_by_website', new FormControl(preselectCertifiedByWebsite));
      
      // certified_by_relevant_locations
      let certifiedByRelevantLocationsValue: string = this.categoryData?.metadata?.certified_by_relevant_locations;
      let preselectCertifiedByRelevantLocations: string = (certifiedByRelevantLocationsValue && typeof certifiedByRelevantLocationsValue === 'string') ? certifiedByRelevantLocationsValue : '';
      this.getMetadata.addControl('certified_by_relevant_locations', new FormControl(preselectCertifiedByRelevantLocations));
    }
  }

  save() {
    let data = this.transformData();
    if (!data) { return false; }

    if (this.editCategory) {
      // Edit a category
      this.categoryService.editCategory(this.categoryData?.id, data).subscribe(
        (category: CategoryModel) => {
          this.alertService.showSuccess('Successfully edited!');
          this.store.dispatch(
            new CategoryActions.UpdateCategory({
              categoryId: this.categoryData?.id,
              newCategory: category,
            })
          );
          this.closeModal();
        },
        (err: HttpErrorResponse) => {
          this.alertService.showError(err.error.message);
        }
      );
    } else {
      // Add new category
      this.categoryService.addCategory(data).subscribe(
        (category: CategoryModel) => {
          this.alertService.showSuccess('Successfully added!');
          this.store.dispatch(new CategoryActions.AddCategory(category));
          this.closeModal();
        },
        (err: HttpErrorResponse) => {
          this.alertService.showError(err.error.message);
        }
      );
    }
  }

  transformData(): any {
    let formData = _.cloneDeep(this.categoryForm.value);
    if (!formData) { return null; }

    let data = {
      title: (formData?.title) ? String(formData?.title) : '',
      metadata: {},
    };

    // When Add a new category, need the parent_id field
    if (formData?.hasOwnProperty('parent_id')) {
      data['parent_id'] = Number(formData?.parent_id);
    }

    // When Add a new category, need the level field
    if (formData?.hasOwnProperty('level')) {
      data['level'] = Number(formData?.level);
    }

    // Metadata
    if (formData?.metadata) {
      let metadata = formData?.metadata;

      if (metadata?.hasOwnProperty('certified_by_website')) {
        let certifiedByWebsiteValue: string = metadata?.certified_by_website;
        let value: string = (certifiedByWebsiteValue && typeof certifiedByWebsiteValue === 'string') ? certifiedByWebsiteValue : '';
        data.metadata['certified_by_website'] = value;
      }

      if (metadata?.hasOwnProperty('certified_by_relevant_locations')) {
        let certifiedByRelevantLocationsValue: string = metadata?.certified_by_relevant_locations;
        let value: string = (certifiedByRelevantLocationsValue && typeof certifiedByRelevantLocationsValue === 'string') ? certifiedByRelevantLocationsValue : '';
        data.metadata['certified_by_relevant_locations'] = value;
      }
    }

    return data;
  }

  getCategories() {
    this.categoriesSubscription = this.store
      .select('categories')
      .pipe(map((categoryState) => categoryState.categories))
      .subscribe((categories: CategoryModel[]) => {
        this.categories = categories;

        // Build and Preselect form
        this.buildAndPreselectCategoryForm();
      });
  }

  closeModal() {
    this.bsModalRef.hide();
  }
}
