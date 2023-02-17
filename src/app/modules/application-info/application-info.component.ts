import { Component, OnInit, OnDestroy, ViewChild, } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { Location } from '@angular/common';

// Services
import { ApplicationService, CategoryService, MultiSelectService } from '@services';

// Models
import { ApplicationModel, ProductModel, CategoryModel, CertificateModel, LevelOfClearanceModel, ApplicationInfoPageQueryParamsKeysModel } from '@models';

// Components
import { AddApplicationComponent } from '../shared/modals/add-application/add-application.component';
import { DeleteProductComponent, CertificateFilesComponent, } from '../shared/modals';

// Store
import { Store } from '@ngrx/store';
import * as ApplicationActions from '@store/application/application.actions';
import * as ProductActions from '@store/product/product.actions';
import * as fromApp from '@store/app.reducer';

// Libs
import { TabsetComponent, TabDirective } from 'ngx-bootstrap/tabs';
import { BsModalService } from 'ngx-bootstrap/modal';
import { Subscription, Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import * as _ from 'lodash';

// Constants
import { AppConstants } from '@core/app.constants';

@Component({
  selector: 'app-application-info',
  templateUrl: './application-info.component.html',
  styleUrls: ['./application-info.component.scss'],
})
export class ApplicationInfoComponent implements OnInit, OnDestroy {
  @ViewChild('staticTabs', { static: false }) staticTabs: TabsetComponent;

  private routeSubscription: Subscription;
  private applicationInfoSubscription: Subscription;
  private productInfoSubscription: Subscription;
  private storeSubscription: Subscription;
  private categoriesSubscription: Subscription;
  public applicationType: Observable<string>;

  public applicationInfoPageQueryParamsKeys: ApplicationInfoPageQueryParamsKeysModel = this.applicationService.getApplicationInfoPageQueryParamsKeys();
  public applicationInfo: ApplicationModel;
  public applicationTypeInfo: CategoryModel;
  public stageItemInfo: any;
  public levelOfClearanceInfo: LevelOfClearanceModel;
  public additionalFeaturesList: CategoryModel[] = [];
  public additionalFeaturesFilteredList: any[] = [];
  public categories: CategoryModel[] = [];
  public applicationTypeList: CategoryModel[] = [];
  public productInfo: ProductModel;

  // Certificates
  public applicationCertificates: CertificateModel[] = [];
  public industrialCertificateList: CertificateModel[] = [];
  public homeCertificateList: CertificateModel[] = [];
  public showFastTrack: boolean;

  constructor(
    private store: Store<fromApp.AppState>,
    private router: Router,
    private activeRouter: ActivatedRoute,
    private location: Location,
    private modalService: BsModalService,
    private applicationService: ApplicationService,
    private categoryService: CategoryService,
    private multiSelectService: MultiSelectService,
  ) { }

  ngOnInit() {
    this.routeSubscription = this.activeRouter.params.subscribe(
      (params: { id: string }) => {
        if (params.id) {
          this.store.dispatch(
            new ApplicationActions.FetchApplication(+params.id)
          );
          this.store.dispatch(new ProductActions.FetchAllProducts());

          this.getInfo();
        }
      }
    );
    this.store
      .select('categories')
      .subscribe((categoryState) => {
        this.showFastTrack = categoryState.isShowFastTrack;
      });
  }

  ngOnDestroy() {
    if (this.routeSubscription) {
      this.routeSubscription.unsubscribe();
    }

    if (this.applicationInfoSubscription) {
      this.applicationInfoSubscription.unsubscribe();
    }

    if (this.storeSubscription) {
      this.storeSubscription.unsubscribe();
    }

    if (this.productInfoSubscription) {
      this.productInfoSubscription.unsubscribe();
    }

    if (this.categoriesSubscription) {
      this.categoriesSubscription.unsubscribe();
    }
  }

  getInfo() {
    this.applicationInfoSubscription = this.store
      .select('applications')
      .pipe(map((applicationStore) => applicationStore.applicationInfo))
      .subscribe((res: ApplicationModel) => {
        if (res) {
          this.applicationInfo = res;

          // GET stageItemInfo
          this.stageItemInfo = AppConstants.StageItemList.find((item) => (item.id === this.applicationInfo.stage));

          this.getApplicationType();
          this.getLevelOfClearanceInfo();
          this.getCategories();

          this.productInfoSubscription = this.store
            .select('products')
            .pipe(
              map((productStore) =>
                productStore.allProducts.find(
                  (product) => product.id === res.product[0]
                )
              )
            )
            .subscribe((product: ProductModel) => {
              if (product) {
                this.productInfo = product;

                // Preselect Tab when there are applicationInfo and productInfo
                setTimeout(() => { // IMPORTANT - without setTimeout, preselect doesn't work. Because the (tabset + tabs) are still hidden on the UI
                  this.preselectTab();
                }, 0);
              }
            });
        }
      });
  }

  getApplicationType() {
    this.applicationType = this.store
      .select('categories')
      .pipe(
        map((categoryState) =>
          this.categoryService.getApplicationTypeById(
            categoryState.categories,
            this.applicationInfo.application[0]
          )
        )
      );
  }

  getLevelOfClearanceInfo() {
    if (!this.applicationInfo) { return false; }

    this.levelOfClearanceInfo = (this.applicationInfo.level_of_clearance)
      ? _.cloneDeep(AppConstants.LevelOfClearanceList).find(item => (item && item.id === this.applicationInfo.level_of_clearance))
      : null;
  }

  getCategories() {
    this.categoriesSubscription = this.store
      .select('categories')
      .pipe(map((categoryState) => categoryState.categories))
      .subscribe((categories: CategoryModel[]) => {
        this.categories = categories;

        // GET certificates
        this.getInitialCertificates();

        // GET ApplicationTypeList
        const APPLICATION_TYPE = AppConstants.MainCategoryNames.APPLICATION_TYPE;
        let applicationTypeParent = categories
          .find((item) => (item.title === APPLICATION_TYPE.title && item.level === APPLICATION_TYPE.level));
        if (applicationTypeParent) {
          this.applicationTypeList = this.multiSelectService.getDropdownById(
            categories,
            applicationTypeParent.id
          );
        }

        // GET applicationTypeInfo
        if (this.applicationTypeList.length > 0) {
          this.applicationTypeInfo = this.applicationTypeList.find((item) => item.id === this.applicationInfo.type);
        }

        // GET additionalFeaturesList
        const ADDITIONAL_FEATURES = AppConstants.MainCategoryNames.ADDITIONAL_FEATURES;
        let additionalFeaturesParent = categories
          .find((item) => (item.title === ADDITIONAL_FEATURES.title && item.level === ADDITIONAL_FEATURES.level));
        let additionalFeaturesThirdLevel = [];
        if (additionalFeaturesParent) {
          this.additionalFeaturesList = this.multiSelectService.getDropdownById(
            categories,
            additionalFeaturesParent.id
          );

          let thirdLevelList = this.additionalFeaturesList.map(item => {
            return this.multiSelectService.getDropdownById(categories, item.id);
          });

          thirdLevelList.map(arr => additionalFeaturesThirdLevel.push(...arr));
        }

        this.additionalFeaturesFilteredList = JSON.parse(JSON.stringify(this.applicationInfo.additional_features))
          .filter((item) => {
            item.ids = item.ids.filter((el) => (typeof el === 'number') ? el : false);
            return item;
          })
          .map((item) => {
            // match id with category and replace id to category. Filtering not matched categories
            item.ids = item.ids
              .map((id) => additionalFeaturesThirdLevel.find((category) => (category.id === id)))
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
      });
  }

  editProduct() {
    const config = {
      class: 'modal-lg modal-dialog-centered',
      initialState: {
        formData: this.applicationInfo,
        isCreateModal: false,
      },
    };
    this.modalService.show(AddApplicationComponent, config);
  }

  duplicateProduct() {
    const copyProductInfo = { ...this.applicationInfo };

    const config = {
      class: 'modal-lg modal-dialog-centered',
      initialState: {
        formData: copyProductInfo,
        isCreateModal: true,
      },
    };
    this.modalService.show(AddApplicationComponent, config);
  }

  deleteProduct() {
    let applicationTypeItem;
    if (this.applicationTypeList.length > 0) {
      applicationTypeItem = this.applicationTypeList.find((item) => item.id === this.applicationInfo.type);
    }

    const config = {
      class: 'modal-lg modal-dialog-centered',
      initialState: {
        deleteMessage: 'That you want to delete this application?',
        product: {
          id: this.applicationInfo.id,
          title: (applicationTypeItem) ? applicationTypeItem.title : null,
        },
        isProduct: true,
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

  preselectTab() {
    let tabIndex: number = Number(this.activeRouter.snapshot.queryParams[this.applicationInfoPageQueryParamsKeys.tabIndex]);

    if (tabIndex > 0 && (this.staticTabs?.tabs?.length && this.staticTabs?.tabs[tabIndex])) {
      this.staticTabs.tabs[tabIndex].active = true;
    } else {
      this.selectTab();
    }
  }

  selectTab(currentTab?: TabDirective) {
    if (!this.staticTabs?.tabs?.length) { return false; }

    setTimeout(() => { // IMPORTANT - without setTimeout, it doesn't work
      let activeTabIndex: number = 0;

      for (let i = 0; i < this.staticTabs?.tabs?.length; i++) {
        let tab: TabDirective = this.staticTabs?.tabs[i];

        if (tab?.active) {
          activeTabIndex = i;
          break;
        }
      }

      if (activeTabIndex > 0) { // Add queryParams to the route
        this.router.navigate([], { relativeTo: this.activeRouter, queryParams: { [this.applicationInfoPageQueryParamsKeys.tabIndex]: activeTabIndex }, queryParamsHandling: 'merge', replaceUrl: true });
      } else { // Remove queryParams from the route
        this.router.navigate([], { relativeTo: this.activeRouter, queryParams: { [this.applicationInfoPageQueryParamsKeys.tabIndex]: null }, queryParamsHandling: 'merge', replaceUrl: true });
      }
    }, 0);
  }

  goBack() {
    this.location.back();
  }

  getInitialCertificates() {
    this.applicationCertificates = [];
    this.industrialCertificateList = [];
    this.homeCertificateList = [];

    if (!this.applicationInfo || !this.applicationInfo.certifications.length) { return false; }

    this.applicationCertificates = this.applicationInfo.certifications.map(item => {
      let certItem: CertificateModel = _.cloneDeep(item);
      let certItemCategory: CategoryModel = (certItem && certItem.category_id)
        ? this.categories.find(certCategory => certCategory.id === certItem.category_id)
        : null;

      if (!certItem || !certItemCategory) { return null; }

      certItem.title = certItemCategory.title;
      certItem.type = (certItemCategory.metadata && certItemCategory.metadata.certification_type)
        ? certItemCategory.metadata.certification_type
        : '';
      certItem.logo = (certItemCategory.metadata && certItemCategory.metadata.certification_logo)
        ? certItemCategory.metadata.certification_logo
        : '';
      certItem.files = this.multiSelectService.getDropdownById(this.categories, certItemCategory.id).map(subItem => ({
        title: subItem.title,
        file: (subItem.metadata && subItem.metadata.certification_file) ? subItem.metadata.certification_file : '',
      }));

      return certItem;
    })
      .filter(item => item);

    this.industrialCertificateList = this.applicationCertificates.filter((item) => (item && item.type && item.type === AppConstants.CertificationTypeNames.INDUSTRIAL));
    this.homeCertificateList = this.applicationCertificates.filter((item) => (item && item.type && item.type === AppConstants.CertificationTypeNames.HOME));
  }
}
