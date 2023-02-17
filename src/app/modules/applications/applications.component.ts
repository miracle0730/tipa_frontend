import { Component, OnInit, OnDestroy, ViewChild, AfterViewInit, ElementRef } from '@angular/core';
import { Router, ActivatedRoute, Event, NavigationEnd, } from '@angular/router';
import { BsModalRef, BsModalService } from 'ngx-bootstrap/modal';
import { Subscription, Observable } from 'rxjs';
import { map, filter } from 'rxjs/operators';
import { AddApplicationComponent } from '../shared/modals/add-application/add-application.component';
import {
  ApplicationModel,
  ProductModel,
  MultiSelectModel,
  CategoryModel,
  FilterSelectModel,
  StreamTypesModel,
  StreamModel,
  StreamSelectModel,
  HeaderFilterModel,
} from '@models';
import { LoaderService, CategoryService, MultiSelectService, HeaderService, } from '@services';

import { AppConstants } from '@core/app.constants';

import { Store } from '@ngrx/store';
import * as fromApp from '@store/app.reducer';
import * as ApplicationActions from '@store/application/application.actions';
import * as ProductActions from '@store/product/product.actions';
import * as ComparisonActions from '@store/comparison/comparison.actions';
import * as _ from 'lodash';

interface GroupedApplicationModel {
  category: CategoryModel;
  list: ApplicationModel[];
}

@Component({
  selector: 'app-applications',
  templateUrl: './applications.component.html',
  styleUrls: ['./applications.component.scss'],
})
export class ApplicationsComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('containerEl') containerEl: ElementRef;
  public keptScrollY: number = 0;

  public isLoading: Observable<boolean>;
  public bsModalRef: BsModalRef;
  private routerEventsSubscription: Subscription;
  private applicationsSubscription: Subscription;
  private categorySubscription: Subscription;
  private productSubscription: Subscription;
  public applicationList: ApplicationModel[] = [];
  public searchedApplicationList: ApplicationModel[] = [];
  public copyApplications: ApplicationModel[] = [];
  public productList: ProductModel[] = [];
  public searchedProductList: ProductModel[] = [];
  public applicationTypeList: any[] = [];
  private products: ProductModel[] = [];
  private categories: CategoryModel[] = [];
  // Grouped applications
  public groupedApplicationList: GroupedApplicationModel[] = [];
  public groupedApplicationInfo: GroupedApplicationModel;
  public keyGroupedCategoryId: string = 'groupedCategoryId'; // key for queryParams

  constructor(
    private router: Router,
    private activatedRoute: ActivatedRoute,
    private store: Store<fromApp.AppState>,
    private modalService: BsModalService,
    private loaderService: LoaderService,
    private categoryService: CategoryService,
    private multiSelectService: MultiSelectService,
    private headerService: HeaderService,
  ) {}

  ngOnInit() {
    this.store.dispatch(new ProductActions.FetchAllProducts());
    this.store.dispatch(new ApplicationActions.FetchApplications(false));
    this.store.dispatch(new ComparisonActions.FetchCompareApplications());
    this.getRouterEvents();
    this.getCategories();
    this.getProducts();

    this.isLoading = this.loaderService.loaderState.pipe(
      map((value) => value.show)
    );
  }

  ngAfterViewInit() {
    this.goToKeptScrollY();
  }

  getRouterEvents() {
    this.routerEventsSubscription = this.router.events.subscribe((event: Event) => {
      if (event instanceof NavigationEnd) {
        // Grouping applications
        this.getGroupedApplicationList();
      }
    });
  }

  getApplications() {
    this.applicationsSubscription = this.store
      .select('applications')
      .subscribe((applicationStore) => {
        // Kept scroll Y
        this.keptScrollY = (typeof applicationStore.keepScrollY === 'number') ? applicationStore.keepScrollY : 0;
        this.goToKeptScrollY();

        if (applicationStore.applications.length > 0) {
          // old sorting by reel and packaging
          // this.applicationList = this.sortApplications(
          //   applicationStore.applications
          // );
          
          this.applicationList = this.getSortedApplicationList(applicationStore.applications, this.categories);
          this.copyApplications = _.cloneDeep(this.applicationList);
          this.searchedApplicationList = _.cloneDeep(this.applicationList);

          // Grouping applications
          this.getGroupedApplicationList();
        }
      });
  }

  getSortedApplicationList(applicationList: ApplicationModel[], categoryList: CategoryModel[]): ApplicationModel[] {
    applicationList = (Array.isArray(applicationList)) ? _.cloneDeep([...applicationList]) : [];
    categoryList = (Array.isArray(categoryList)) ? _.cloneDeep([...categoryList]) : [];

    // Sort order by: 1-(Category Application Type display_priority), 2-(Category Application Type id), 3-(Application display_priority)
    let sortedApplicationList: ApplicationModel[] = _.orderBy(
      applicationList,
      [
        (item) => {
          let applicationType: CategoryModel = categoryList.find(categoryItem => categoryItem?.id === item?.type );
          return applicationType?.metadata?.application_type_display_priority || null;
        },
        (item) => {
          let applicationType: CategoryModel = categoryList.find(categoryItem => categoryItem?.id === item?.type );
          return applicationType?.id || null;
        },
        (item) => {
          return item?.display_priority || null;
        }
      ],
      ['asc', 'asc', 'asc']
    );

    return _.cloneDeep([...sortedApplicationList]);
  }
  
  sortApplications(applications: ApplicationModel[]) {
    const reels = _.sortBy(
      _.filter(applications, (application) => {
        return (
          this.categoryService.getApplicationTypeById(
            this.categories,
            application.application[0]
          ) === 'Reel'
        );
      }),
      (application) => {
        let applicationTypeItem;
        if (this.applicationTypeList.length > 0) {
          applicationTypeItem = this.applicationTypeList.find((item) => item.id === application.type);
        }
        return (applicationTypeItem) ? applicationTypeItem.title : null;
      }
    );

    const packaging = _.sortBy(
      _.filter(applications, (application) => {
        return (
          this.categoryService.getApplicationTypeById(
            this.categories,
            application.application[0]
          ) !== 'Reel'
        );
      }),
      (application) => {
        let applicationTypeItem;
        if (this.applicationTypeList.length > 0) {
          applicationTypeItem = this.applicationTypeList.find((item) => item.id === application.type);
        }
        return (applicationTypeItem) ? applicationTypeItem.title : null;
      }
    );

    return _.concat(reels, packaging);
  }

  getCategories() {
    this.categorySubscription = this.store
      .select('categories')
      .pipe(map((categoryState) => categoryState.categories))
      .subscribe((categories: CategoryModel[]) => {
        this.categories = categories;

        // GET ApplicationTypeList
        const APPLICATION_TYPE = AppConstants.MainCategoryNames.APPLICATION_TYPE;
        let applicationTypeParent = this.categories
          .find((item) => (item.title === APPLICATION_TYPE.title && item.level === APPLICATION_TYPE.level) );
        if (applicationTypeParent) {
          this.applicationTypeList = this.multiSelectService.getDropdownById(
            this.categories,
            applicationTypeParent.id
          );
        }

        // GET Applications after Categories
        this.getApplications();
      });
  }

  getProducts() {
    this.productSubscription = this.store
      .select('products')
      .pipe(
        filter((productStore) => productStore.allProductsLoaded),
        map((productStore) => productStore.allProducts)
      )
      .subscribe((products: ProductModel[]) => {
        this.products = products;
      });
  }

  searchResultEvent(results: {
    applications: ApplicationModel[];
    products: ProductModel[];
  }) {
    if (results) {
      this.applicationList = this.getSortedApplicationList(results.applications, this.categories);
      this.productList = results.products;
    } else {
      this.applicationList = this.copyApplications;
      this.productList = [];
    }

    // filtering applications based on the search res
    this.searchedApplicationList = _.cloneDeep(this.applicationList);
    this.searchedProductList = _.cloneDeep(this.productList);
    const mainFilter = JSON.parse(localStorage.getItem('mainFilter'));
    this.filterEvent(mainFilter);
  }

  ngOnDestroy() {
    this.keepScrollY();
    
    if (this.routerEventsSubscription) {
      this.routerEventsSubscription.unsubscribe();
    }

    if (this.applicationsSubscription) {
      this.applicationsSubscription.unsubscribe();
    }

    if (this.productSubscription) {
      this.productSubscription.unsubscribe();
    }

    if (this.categorySubscription) {
      this.categorySubscription.unsubscribe();
    }
  }

  keepScrollY() {
    let scrollY: number = (this.containerEl) ? this.containerEl.nativeElement.scrollTop || 0 : 0;
    this.store.dispatch(new ApplicationActions.KeepScrollYApplication(scrollY));
  }

  goToKeptScrollY() {
    if (this.containerEl) {
      this.containerEl.nativeElement.scrollTop = (typeof this.keptScrollY === 'number') ? this.keptScrollY : 0;
    }
  }

  openAddApplicationModal() {
    const config = {
      class: 'modal-lg modal-dialog-centered',
      initialState: {
        formData: null,
        isCreateModal: true,
      },
    };
    this.modalService.show(AddApplicationComponent, config);
  }

  selectGroupedApplicationInfo(groupedItem?: GroupedApplicationModel) {
    let groupedItemId: number = (groupedItem && groupedItem.category && groupedItem.category.id) ? groupedItem.category.id : null;
    let foundGroupedItem: GroupedApplicationModel = (groupedItemId)
      ? this.groupedApplicationList.find(item => (item && item.category && item.category.id === groupedItemId) )
      : null;
    this.groupedApplicationInfo = (foundGroupedItem) ? foundGroupedItem : null;

    // IMPORTANT, current url should be 'applications'. Because there is an additional method call
    if (this.router.url.includes('applications')) { // IMPORTANT
      if (this.groupedApplicationInfo) { // SELECT group
        this.router.navigate([], { relativeTo: this.activatedRoute, queryParams: { [this.keyGroupedCategoryId]: this.groupedApplicationInfo.category.id }, queryParamsHandling: 'merge', replaceUrl: true });
      } else { // RESET group
        this.router.navigate([], { relativeTo: this.activatedRoute, queryParams: { [this.keyGroupedCategoryId]: null }, queryParamsHandling: 'merge', replaceUrl: true });
      }
    }

    // Scroll to top when is grouping
    let headerFilter: HeaderFilterModel = this.headerService.getHeaderFilter();
    if (headerFilter && headerFilter.grouping) {
      if (this.groupedApplicationInfo && this.containerEl) { // When are applications of group
        this.containerEl.nativeElement.scrollTop = 0;
      }
    }
  }

  getGroupedApplicationList() {
    let headerFilter: HeaderFilterModel = this.headerService.getHeaderFilter();
    this.groupedApplicationList = []; // IMPORTANT reset by default

    // When applications are empty
    if (!this.applicationList.length) { return false; }

    // Grouping
    if (headerFilter && headerFilter.grouping) {
      let objGrouped = _.groupBy(_.cloneDeep(this.applicationList), (item) => { // grouping by application type
        let foundCategory: CategoryModel = this.categories.find(categoryItem => ((item && item.type) && (categoryItem && categoryItem.id) && (item.type === categoryItem.id)) );
        return (foundCategory) ? foundCategory.id : null;
      });

      let arrGrouped: GroupedApplicationModel[] = _.map(objGrouped, (value, key) => {
        let category: CategoryModel = this.categories.find(categoryItem => ((categoryItem && categoryItem.id) && (categoryItem.id === Number(key))) );
        let list: ApplicationModel[] = _.cloneDeep(value);

        return { category, list };
      });

      // Sorting groups by application_type_display_priority
      arrGrouped = _.orderBy(arrGrouped, (item) => {
        return item?.category?.metadata?.application_type_display_priority || null;
      }, ['asc']);

      this.groupedApplicationList = _.cloneDeep(arrGrouped).filter(item => (item && item.category && item.list.length) );
    }

    // Check and preselect group by keyGroupedCategoryId from queryParams
    let groupedCategoryId: number = Number(this.activatedRoute.snapshot.queryParams[this.keyGroupedCategoryId]);
    let foundGroupedItem: GroupedApplicationModel = (groupedCategoryId) ? this.groupedApplicationList.find(groupedItem => (groupedItem && groupedItem.category && groupedItem.category.id === groupedCategoryId) ) : null;
    
    if (foundGroupedItem) { // SELECT found group
      this.selectGroupedApplicationInfo(foundGroupedItem);
    } else { // RESET keyGroupedCategoryId from queryParams
      this.selectGroupedApplicationInfo();
    }
  }

  filterEvent(event: FilterSelectModel) {
    const filterValue = _.omitBy(event, (value) => !value.length);

    if (_.some(event, (value) => value.length > 0)) {
      this.filterPromise(filterValue).then((res: ApplicationModel[]) => {
        this.applicationList = this.getSortedApplicationList(res, this.categories);
        this.productList = [];

        // Grouping applications
        this.getGroupedApplicationList();
      });
    } else {
      this.applicationList = _.cloneDeep(this.searchedApplicationList);
      this.productList = _.cloneDeep(this.searchedProductList);

      // Grouping applications
      this.getGroupedApplicationList();
    }
  }

  filterPromise(filteObj) {
    return new Promise((resolve, reject) => {
      const applicationList = _.cloneDeep(
        this.searchedApplicationList
      ) as ApplicationModel[];
      let newApplications = applicationList;

      _.forEach(_.keys(filteObj), (key: string) => {
        if (key === 'productFamilySelected') {
          newApplications = this.makeProductFamilyFilter(
            newApplications,
            filteObj[key]
          );
        } else if (key === 'productFilteredSelected') {
          newApplications = this.makeProductFilter(
            newApplications,
            filteObj[key]
          );
        } else if (key === 'streamListSelected') {
          newApplications = this.makeStreamFilter(newApplications, filteObj[key]);
        } else if (key === 'stageListSelected') {
          newApplications = this.makeStageFilter(newApplications, filteObj[key]);
        } else {
          if (this.getSegmentKey(key)) {
            newApplications = this.makeFilterSegment(
              newApplications,
              filteObj[key],
              key
            );
          } else {
            newApplications = this.makeFilter(newApplications, filteObj[key]);
          }
        }
      });

      resolve(newApplications);
    });
  }

  makeFilterSegment(
    applicationList: ApplicationModel[],
    selectedItem: MultiSelectModel[],
    key: string
  ) {
    const field = this.getSegmentField(key);
    return _.filter(applicationList, (application: ApplicationModel) => {
      return application[field].includes(selectedItem[0].id);
    });
  }

  makeFilter(
    applicationList: ApplicationModel[],
    seletectedItem: MultiSelectModel[]
  ): ApplicationModel[] {
    return _.filter(applicationList, (application: ApplicationModel) => {
      return this.recursiveCheckParent(
        seletectedItem[0].id,
        application.application[0]
      );
    });
  }

  makeProductFamilyFilter(
    applicationList: ApplicationModel[],
    productFamilySelected: MultiSelectModel[]
  ) {
    return _.filter(applicationList, (application: ApplicationModel) => {
      const currentProduct = _.find(
        this.products,
        (product: ProductModel) => product.id === application.product[0]
      );
      if (currentProduct && currentProduct.family.length > 0) {
        return currentProduct.family[0] === productFamilySelected[0].id
          ? true
          : false;
      } else {
        return false;
      }
    });
  }

  makeProductFilter(
    applicationList: ApplicationModel[],
    productSelected: MultiSelectModel[]
  ) {
    return _.filter(applicationList, (application: ApplicationModel) => {
      return application.product[0] === productSelected[0].id;
    });
  }

  makeStreamFilter(applicationList: ApplicationModel[], streamListSelected: StreamSelectModel[]): ApplicationModel[] {
    const streamTypes: StreamTypesModel = AppConstants.StreamTypes;

    // return all applications, if not selected streams
    if (!streamListSelected.length) { return applicationList; }

    // return all applications, if selected "custom"
    let foundCustom = streamListSelected.find(stream => stream.type === streamTypes.CUSTOM);
    if (foundCustom) { return applicationList; }

    return _.filter(applicationList, (application: ApplicationModel) => {
      let foundStream = application.streams.find(stream => {
        let found = streamListSelected.find(item => (stream.checked && stream.type === item.type) );
        return found;
      });

      // Only for FAST_TRACK
      let foundFt: StreamSelectModel = streamListSelected.find(stream => stream.type === streamTypes.FAST_TRACK);
      let foundFtItems: boolean = (foundFt) ? Boolean(application?.fast_track?.items?.length) : false;

      return (foundStream || foundFtItems) ? true : false;
    });
  }

  makeStageFilter(applicationList: ApplicationModel[], stageListSelected: MultiSelectModel[]): ApplicationModel[] {
    let selectedStage: MultiSelectModel = (stageListSelected && stageListSelected.length)
      ? stageListSelected[0] // single select
      : null;

    // return all applications, if stage is not selected
    if (!selectedStage) { return applicationList; }

    return _.filter(applicationList, (application: ApplicationModel) => application.stage === selectedStage.id);
  }

  recursiveCheckParent(filterId: number, currentId: number): boolean {
    const currentCategory = this.categoryService.getCategoryById(
      this.categories,
      currentId
    );

    if (currentCategory) {
      if (currentCategory.id === filterId) {
        return true;
      } else {
        return this.recursiveCheckParent(filterId, currentCategory.parent_id);
      }
    }
  }

  private getSegmentKey(key: string) {
    if (
      key === 'segmentSelected' ||
      key === 'segmentTypeSelected' ||
      key === 'packetGoodsSelected'
    ) {
      return true;
    } else {
      return false;
    }
  }

  private getSegmentField(key: string) {
    switch (key) {
      case 'segmentSelected':
        return 'segment';
      case 'segmentTypeSelected':
        return 'segment_type';
      case 'packetGoodsSelected':
        return 'packed_goods';
    }
  }
}
