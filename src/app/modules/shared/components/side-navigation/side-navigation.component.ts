import {
  Component,
  OnInit,
  OnDestroy,
  Output,
  EventEmitter, HostListener,
} from '@angular/core';
import {Router} from '@angular/router';
import {Store} from '@ngrx/store';
import {Subscription} from 'rxjs';
import {map, filter} from 'rxjs/operators';
import {
  AuthService,
  AmplitudeService,
  MultiSelectService,
  ApplicationService,
  ProductService,
} from '@services';
import {IDropdownSettings} from 'ng-multiselect-dropdown';
import {
  CategoryModel,
  ProfileModel,
  MultiSelectModel,
  FilterSelectModel,
  ProductModel,
  StreamModel,
  StageItem,
  ProductsFilterModel,
} from '@models';

import * as fromApp from '@store/app.reducer';
import * as LogoutActions from '@store/auth/auth.actions';
import * as _ from 'lodash';
import * as SideMenuActions from "@store/side-menu/side-menu.actions";

import { AppConstants } from '@core/app.constants';

enum SelectNextEnum {
  applicationSelect = 1,
  productFamilySelect = 2,
  segmentSelect = 3,
  segmentTypeSelect = 4,
}

@Component({
  selector: 'app-side-navigation',
  templateUrl: './side-navigation.component.html',
  styleUrls: ['./side-navigation.component.scss'],
})
export class SideNavigationComponent implements OnInit, OnDestroy {
  @Output() filterEvent = new EventEmitter();
  @Output() productsFilterEvent = new EventEmitter();
  public isApplicationRoute: boolean;
  public isProductRoute: boolean;
  public canViewStage: boolean;
  private subscription: Subscription;
  private subscription2: Subscription;
  private applicationSubscription: Subscription;
  private profileSubscription: Subscription;
  private productSubscription: Subscription;
  private searchEventSubscription: Subscription;
  public profileData: ProfileModel;

  public dropdownSettings: IDropdownSettings = {
    singleSelection: true,
    idField: 'id',
    textField: 'title',
    itemsShowLimit: 1,
    allowSearchFilter: false,
    enableCheckAll: false,
    closeDropDownOnSelection: true,
  };

  public categories: CategoryModel[] = [];
  public products: ProductModel[] = [];

  public stageList: StageItem[] = AppConstants.StageItemList;
  public streamList: StreamModel[] = AppConstants.StreamList;
  public availableInThisTerritoriesList: CategoryModel[] = [];
  public applicationList: CategoryModel[] = [];
  public applicationTypeList: CategoryModel[] = [];
  public productFamilyList: CategoryModel[] = [];
  public productFilteredList: ProductModel[] = [];
  public segmentList: CategoryModel[] = [];
  public segmentTypeList: CategoryModel[] = [];
  public packetGoodsList: CategoryModel[] = [];

  public filterOptionsSelected: FilterSelectModel = {
    stageListSelected: [],
    streamListSelected: [],
    applicationListSelected: [],
    applicationTypeSelected: [],
    productFamilySelected: [],
    productFilteredSelected: [],
    segmentSelected: [],
    segmentTypeSelected: [],
    packetGoodsSelected: [],
  };

  public productsFilter: ProductsFilterModel = {
    stageListSelected: [],
    territoryListSelected: [],
  };

  @HostListener('window:resize', ['$event'])
  onResize(event) {
    const width = typeof event === 'number' ? event : event.target.innerWidth;
    const applicationInfo = 'application-info';
    const productInfo = 'product-info';
    if (this.router.url.includes(applicationInfo) || this.router.url.includes(productInfo)) {
      this.store.dispatch(new SideMenuActions.SetSidenavActive(true));
    } else if (width >= 992) {
      this.store.dispatch(new SideMenuActions.SetSidenavActive(false));
    }
  }

  constructor(
    private router: Router,
    private authService: AuthService,
    private amplitudeService: AmplitudeService,
    private store: Store<fromApp.AppState>,
    private multiSelectService: MultiSelectService,
    private applicationService: ApplicationService,
    private productService: ProductService,
  ) {
  }

  ngOnInit() {
    this.isApplicationRoute = this.router.url.includes('applications');
    this.isProductRoute = this.router.url.includes('products');
    this.onResize(window.innerWidth);
    this.profileSubscription = this.store
      .select('profile')
      .pipe(map((profileState) => profileState.profile))
      .subscribe((profile) => {
        this.profileData = profile;
        this.canViewStage = !(profile.role==3);
      });

    if (this.isProductRoute) {

      this.subscription2 = this.store
          .select('categories')
          .pipe(map((categoryState) => categoryState.categories))
          .subscribe((categories: CategoryModel[]) => {
              this.categories = categories;
              this.getAvailableInThisTerritoriesList();

              let parsedProductsFilter: ProductsFilterModel = this.productService.getProductsFilter();

              if (parsedProductsFilter) {
                  this.productsFilter = parsedProductsFilter;
              }
          });
    }

    if (this.isApplicationRoute) {
      this.subscription = this.store
        .select('categories')
        .pipe(map((categoryState) => categoryState.categories))
        .subscribe((categories: CategoryModel[]) => {
          this.categories = categories;
          this.applicationList = this.multiSelectService.getDropdownById(
            categories,
            1
          );
          this.productFamilyList = this.multiSelectService.getDropdownById(
            categories,
            2
          );

          this.segmentList = this.multiSelectService.getDropdownById(
            categories,
            3
          );

          this.segmentTypeList = this.multiSelectService.getDropdownByArray(
            categories,
            _.map(this.segmentList, (segment) => segment.id)
          );

          this.applicationSubscription = this.store
            .select('applications')
            .pipe(
              map((applicationStore) => applicationStore.allApplicationsLoaded)
            )
            .subscribe((res) => {
              if (res) {
                const parsed = JSON.parse(localStorage.getItem('mainFilter'));
                if (parsed) {
                  this.filterOptionsSelected = parsed;

                  if (
                    this.filterOptionsSelected.applicationListSelected.length >
                    0
                  ) {
                    this.applicationTypeList = this.multiSelectService.getDropdownByTitle(
                      this.categories,
                      this.filterOptionsSelected.applicationListSelected[0]
                        .title
                    );
                  }

                  if (
                    this.filterOptionsSelected.segmentTypeSelected.length > 0
                  ) {
                    this.packetGoodsList = this.multiSelectService.getDropdownByTitle(
                      this.categories,
                      this.filterOptionsSelected.segmentTypeSelected[0].title
                    );
                  }

                  this.emitFilterEvent();
                }
              }
            });
        });

      this.productSubscription = this.store
        .select('products')
        .pipe(
          filter((productState) => productState.allProductsLoaded),
          map((productState) => productState.allProducts)
        )
        .subscribe((products: ProductModel[]) => {
            const parsed = JSON.parse(localStorage.getItem('mainFilter'));
          this.products = products;
          this.productFilteredList = products;
        });

      // NOT need to reset application filter
      // this.listenSearchEvent();
    }
  }

    getAvailableInThisTerritoriesList() {
        const AVAILABLE_TERRITORIES = AppConstants.MainCategoryNames.TERRITORIES;
        const availableInThisTerritoriesList: CategoryModel = (this.categories)
            ? this.categories.find((category) => (category.title === AVAILABLE_TERRITORIES.title && category.level === AVAILABLE_TERRITORIES.level))
            : null;
        console.log('AC', availableInThisTerritoriesList, availableInThisTerritoriesList.id);

        this.availableInThisTerritoriesList = (availableInThisTerritoriesList)
            ? this.multiSelectService.getDropdownById(this.categories, availableInThisTerritoriesList.id)
            : [];
    }

  listenSearchEvent() {
    this.searchEventSubscription = this.applicationService.searchEvent.subscribe(
      (res) => {
        // NOT need to reset application filter
        // if (res) {
        //   this.filterOptionsSelected = {
        //     stageListSelected: [],
        //     streamListSelected: [],
        //     applicationListSelected: [],
        //     applicationTypeSelected: [],
        //     productFamilySelected: [],
        //     productFilteredSelected: [],
        //     segmentSelected: [],
        //     segmentTypeSelected: [],
        //     packetGoodsSelected: [],
        //   };
        //   this.applicationTypeList = [];
        //   this.packetGoodsList = [];
        // }
      }
    );
  }

  ngOnDestroy() {
    if (this.subscription) {
      this.subscription.unsubscribe();
    }

    if (this.profileSubscription) {
      this.profileSubscription.unsubscribe();
    }

    if (this.productSubscription) {
      this.productSubscription.unsubscribe();
    }

    if (this.applicationSubscription) {
      this.applicationSubscription.unsubscribe();
    }

    if (this.searchEventSubscription) {
      this.searchEventSubscription.unsubscribe();
    }
  }

  logOut() {
    this.amplitudeService.addNewEvent('Logout event', {
      name: this.profileData.fullname,
      id: this.profileData.id,
      email: this.profileData.email,
    });
    this.authService.removeTokens();
    this.router.navigate(['login']);
    this.store.dispatch(new LogoutActions.LogoutAction());
  }

  setNextDropdownValues(value: MultiSelectModel, type: SelectNextEnum) {
    console.log(type, value);
    switch (type) {
      case SelectNextEnum.productFamilySelect:
        this.filterOptionsSelected.productFilteredSelected = [];
        this.productFilteredList = value
          ? this.products.filter((item) => item.family.includes(value.id))
          : this.products;
        break;
      case SelectNextEnum.applicationSelect:
        this.filterOptionsSelected.applicationTypeSelected = [];
        this.applicationTypeList = value
          ? this.multiSelectService.getDropdownByTitle(
            this.categories,
            value.title
          )
          : [];
        break;
      case SelectNextEnum.segmentSelect:
        this.filterOptionsSelected.segmentTypeSelected = [];
        this.filterOptionsSelected.packetGoodsSelected = [];
        this.packetGoodsList = [];
        this.segmentTypeList = value
          ? this.multiSelectService.getDropdownByTitle(
            this.categories,
            value.title
          )
          : this.multiSelectService.getDropdownByArray(
            this.categories,
            _.map(this.segmentList, (segment) => segment.id)
          );
        break;
      case SelectNextEnum.segmentTypeSelect:
        this.filterOptionsSelected.packetGoodsSelected = [];
        this.packetGoodsList = value
          ? this.multiSelectService.getDropdownByArray(
            this.categories,
            [value.id]
          )
          : [];
        break;
    }
  }

  getDropdownSettings(multi?: boolean, newSettings?: IDropdownSettings) {
    let settings = {
      singleSelection: (multi) ? false : true,
      idField: 'id',
      textField: 'title',
      itemsShowLimit: 1,
      allowSearchFilter: false,
      enableCheckAll: false,
      closeDropDownOnSelection: (multi) ? false : true,
    };
    return Object.assign({}, settings, newSettings);
  }

  emitFilterEvent() {
    localStorage.setItem(
      'mainFilter',
      JSON.stringify(this.filterOptionsSelected)
    );
    this.filterEvent.emit(this.filterOptionsSelected);
    this.applicationService.filterEvent.next(this.filterOptionsSelected);
  }

  emitProductsFilterEvent() {
    this.productService.setProductsFilter(this.productsFilter);
    this.productsFilterEvent.emit(this.productsFilter);
  }
}
