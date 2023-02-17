import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Location } from '@angular/common';

import { BsModalService } from 'ngx-bootstrap/modal';
import { map } from 'rxjs/operators';
import { Subscription } from 'rxjs';

import { MultiSelectService, } from '@services';
import { CategoryModel, CertificateModel, LevelOfClearanceModel, ProductModel } from '@models';
import { DeleteProductComponent, CertificateFilesComponent } from '../shared/modals';
import { AddProductComponent } from '../shared/modals/add-product/add-product.component';

import { Store } from '@ngrx/store';
import * as fromApp from '@store/app.reducer';
import * as ProductActions from '@store/product/product.actions';

import * as _ from 'lodash';
import { AppConstants } from '@core/app.constants';

@Component({
  selector: 'app-product-info',
  templateUrl: './product-info.component.html',
  styleUrls: ['./product-info.component.scss'],
})
export class ProductInfoComponent implements OnInit, OnDestroy {
  private routeSubscription: Subscription;
  private productInfoSubscription: Subscription;
  public categoriesSubscription: Subscription;
  public productInfo: ProductModel = null;
  public categories: CategoryModel[] = [];
  public stageItem: any;
  public levelOfClearanceInfo: LevelOfClearanceModel;
  public certificates: CertificateModel[] = [];
  // additional_features
  public additionalFeaturesList: CategoryModel[] = [];
  public additionalFeaturesFilteredList: any[] = [];

  constructor(
    private activeRouter: ActivatedRoute,
    private location: Location,
    private modalService: BsModalService,
    private multiSelectService: MultiSelectService,
    private store: Store<fromApp.AppState>
  ) {}

  ngOnInit() {
    this.routeSubscription = this.activeRouter.params.subscribe(
      (params: { id: string }) => {
        if (params.id) {
          this.store.dispatch(new ProductActions.FetchProduct(+params.id));

          this.getProductInfo();
        }
      }
    );
  }

  getProductInfo() {
    this.productInfoSubscription = this.store
      .select('products')
      .pipe(map((productStore) => productStore.productInfo))
      .subscribe((product: ProductModel) => {
        this.productInfo = product;

        this.getCategories();

        if (this.productInfo) {
          // Stage Item
          this.stageItem = AppConstants.StageItemList.find((item) => (item.id === this.productInfo.stage));
          // level_of_clearance
          this.getLevelOfClearanceInfo();
        }
      });
  }

  getCategories() {
    this.categoriesSubscription = this.store
      .select('categories')
      .pipe(map((categoryState) => categoryState.categories))
      .subscribe((categories: CategoryModel[]) => {
        this.categories = categories;

        this.getInitialCertificates();
        this.getInitialAdditionalFeatures();
      });
  }

  ngOnDestroy() {
    if (this.routeSubscription) {
      this.routeSubscription.unsubscribe();
    }

    if (this.productInfoSubscription) {
      this.productInfoSubscription.unsubscribe();
    }

    if (this.categoriesSubscription) {
      this.categoriesSubscription.unsubscribe();
    }
  }

  editMaterial() {
    const config = {
      class: 'modal-lg modal-dialog-centered',
      initialState: {
        formData: this.productInfo,
        isCreateModal: false,
      },
    };
    this.modalService.show(AddProductComponent, config);
  }

  duplicateMaterial() {
    const copyMaterial = { ...this.productInfo };
    copyMaterial.title = copyMaterial.title + '(copy)';
    const config = {
      class: 'modal-lg modal-dialog-centered',
      initialState: {
        formData: copyMaterial,
        isCreateModal: true,
      },
    };
    this.modalService.show(AddProductComponent, config);
  }

  deleteMaterial() {
    const config = {
      class: 'modal-lg modal-dialog-centered',
      initialState: {
        deleteMessage: 'That you want to delete this product?',
        product: { id: this.productInfo.id, title: this.productInfo.title },
        isProduct: false,
      },
    };
    this.modalService.show(DeleteProductComponent, config);
  }

  openCertificateFiles(certItem: CertificateModel) {
    let certificate: CertificateModel = (certItem) ? certItem : null;
    if (!certificate) { return false; }

    const config = {
      class: 'modal-md modal-dialog-centered',
      initialState: {
        certificate: certificate,
      },
    };
    this.modalService.show(CertificateFilesComponent, config);
  }

  goBack() {
    this.location.back();
  }

  getLevelOfClearanceInfo() {
    if (!this.productInfo) { return false; }

    this.levelOfClearanceInfo = (this.productInfo.level_of_clearance)
      ? _.cloneDeep(AppConstants.LevelOfClearanceList).find(item => (item && item.id === this.productInfo.level_of_clearance))
      : null;
  }

  getInitialAdditionalFeatures() {
    // GET additionalFeaturesList
    const ADDITIONAL_FEATURES = AppConstants.MainCategoryNames.ADDITIONAL_FEATURES;
    let additionalFeaturesParent = this.categories
      .find((item) => (item.title === ADDITIONAL_FEATURES.title && item.level === ADDITIONAL_FEATURES.level) );
    let additionalFeaturesThirdLevel = [];
    if (additionalFeaturesParent) {
      this.additionalFeaturesList = this.multiSelectService.getDropdownById(
        this.categories,
        additionalFeaturesParent.id
      );

      let thirdLevelList = this.additionalFeaturesList.map(item => {
        return this.multiSelectService.getDropdownById(this.categories, item.id);
      });

      thirdLevelList.map(arr => additionalFeaturesThirdLevel.push(...arr) );
    }

    if (this.productInfo && this.productInfo.additional_features && Array.isArray(this.productInfo.additional_features)) {
      this.additionalFeaturesFilteredList = JSON.parse(JSON.stringify(this.productInfo.additional_features))
        .filter((item) => {
          item.ids = item.ids.filter((el) => (typeof el === 'number') ? el : false);
          return item;
        })
        .map((item) => {
          // match id with category and replace id to category. Filtering not matched categories
          item.ids = item.ids
            .map((id) => additionalFeaturesThirdLevel.find((category) => (category.id === id)) )
            .filter(el => (el) ? el : false);

          // if categories are empty
          if (!item.ids.length) { return item; }

          // build tree of parents with nested categories
          item.tree = [];
          this.additionalFeaturesList.map((parent) => {
            let found = item.ids.find((nested) => nested.parent_id === parent.id);
            if (found) {
              item.tree.push({
                ...parent,
                nestedCategories: []
              });
            }
          });

          // push nested categories to parents
          item.ids.map(nested => {
            item.tree.find(parent => {
              let found = nested.parent_id === parent.id;
              if (found) { parent.nestedCategories.push(nested); }
              return found;
            });
          });

          return item;
        })
        .filter((item) => {
          item.ids = item.ids.filter((el) => (el) ? el : false);
          return (item.ids.length > 0);
        });
    } else {
      this.additionalFeaturesFilteredList = [];
    }
  }

  getInitialCertificates() {
    if (!this.productInfo) { return false; }

    this.certificates = this.productInfo.certifications.map(certItem => {
      const copyCertItem = _.cloneDeep(certItem);
      let foundCategory: CategoryModel = (copyCertItem && copyCertItem.category_id)
        ? this.categories.find(catItem => catItem.id === copyCertItem.category_id)
        : null;

      if (foundCategory) {
        copyCertItem.title = (foundCategory.title) ? foundCategory.title : '';
        copyCertItem.type = (foundCategory.metadata && foundCategory.metadata.certification_type)
          ? foundCategory.metadata.certification_type
          : '';
        copyCertItem.logo = (foundCategory.metadata && foundCategory.metadata.certification_logo)
          ? foundCategory.metadata.certification_logo
          : '';
        copyCertItem.files = this.multiSelectService.getDropdownById(this.categories, foundCategory.id).map(subItem => ({
          title: subItem.title,
          file: (subItem.metadata && subItem.metadata.certification_file) ? subItem.metadata.certification_file : '',
        }));
      }

      return copyCertItem;
    });
  }

  get getFoodCertificates() {
    return this.certificates.filter((item) =>
      (item && item.type && item.type === AppConstants.CertificationTypeNames.FOOD)
    );
  }

  get getIndustrialCertificates() {
    return this.certificates.filter((item) =>
      (item && item.type && item.type === AppConstants.CertificationTypeNames.INDUSTRIAL)
    );
  }

  get getHomeCertificates() {
    return this.certificates.filter((item) =>
      (item && item.type && item.type === AppConstants.CertificationTypeNames.HOME)
    );
  }
}
