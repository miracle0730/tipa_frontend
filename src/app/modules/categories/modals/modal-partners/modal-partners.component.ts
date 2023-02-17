import {Component, OnInit} from '@angular/core';
import {Store} from '@ngrx/store';
import * as fromApp from '@store/app.reducer';
import {BsModalRef} from 'ngx-bootstrap/modal';
import {FormBuilder, FormControl, FormGroup, Validators} from '@angular/forms';
import {AlertService, CategoryService} from '@services';
import {CategoryModel} from '@models';
import {Subscription} from 'rxjs';
import {map} from 'rxjs/operators';
import {AppConstants} from '@core/app.constants';
import * as _ from 'lodash';
import {HttpErrorResponse} from '@angular/common/http';
import * as CategoryActions from '@store/category/category.actions';

@Component({
  selector: 'app-modal-partners',
  templateUrl: './modal-partners.component.html',
  styleUrls: ['./modal-partners.component.scss']
})
export class ModalPartnersComponent implements OnInit {
  public categoryData: CategoryModel; // Input variable

  public categoriesSubscription: Subscription;

  public partnersForm: FormGroup;
  public editCategory: boolean;
  public categories: CategoryModel[] = [];

  constructor(
    private store: Store<fromApp.AppState>,
    private bsModalRef: BsModalRef,
    private formBuilder: FormBuilder,
    private alertService: AlertService,
    private categoryService: CategoryService,
  ) {
    this.partnersForm = this.formBuilder.group({
      title: new FormControl('', Validators.required),
      metadata: new FormGroup({}), // metadata is dynamic
    });
  }

  ngOnInit(): void {
    this.getCategories();
  }

  get getMetadata() {
    return this.partnersForm.get('metadata') as FormGroup;
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

  buildAndPreselectCategoryForm() {
    const mainCategory: CategoryModel = this.categoryService.getMainCategoryBySubCategory(this.categories, this.categoryData);
    const isPartners: boolean = this.categoryService.getEqualityMainCategory(mainCategory, AppConstants.MainCategoryNames.PARTNERS);

    if (!this.categoryData || !isPartners) {
      setTimeout(() => {
        this.closeModal();
      }, 0); // IMPORTANT setTimeout, because without setTimeout it doesn't work
      return false;
    }

    // Edit or New category
    if (this.categoryData?.id) {
      // Edit
      this.editCategory = true;
      this.partnersForm.get('title').setValue(this.categoryData?.title || '');
    } else {
      // New
      this.editCategory = false;
      this.partnersForm.addControl('parent_id', new FormControl(this.categoryData?.parent_id || null));
      this.partnersForm.addControl('level', new FormControl(this.categoryData?.level || null));
    }

    // Build and Preselect form by level
    const categoryLevel: number = this.categoryData?.level;
    if (categoryLevel === 2) {
      // partner_owner
      const partnerOwnerValue: string = this.categoryData?.metadata?.partner_owner;
      const preselectPartnerOwnerValue: string = (partnerOwnerValue && typeof partnerOwnerValue === 'string') ? partnerOwnerValue : '';
      this.getMetadata.addControl('partner_owner', new FormControl(preselectPartnerOwnerValue));

      // zoho_id
      const zohoIdValue: string = this.categoryData?.metadata?.zoho_id;
      const preselectZohoIdValue: string = (zohoIdValue && typeof zohoIdValue === 'string') ? zohoIdValue : '';
      this.getMetadata.addControl('zoho_id', new FormControl(preselectZohoIdValue));
    }
  }

  saveModal(): void {
    const data = _.cloneDeep(this.partnersForm.value);
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

  closeModal() {
    this.bsModalRef.hide();
  }
}
