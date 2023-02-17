import {
  Component,
  OnInit,
  AfterViewInit,
  Output,
  EventEmitter,
  OnDestroy,
  ViewChild,
  ElementRef
} from '@angular/core';
import { Router } from '@angular/router';
import { FormGroup, FormBuilder, FormControl } from '@angular/forms';
import { combineLatest, Subscription, Observable } from 'rxjs';
import {
  map,
  debounceTime,
  distinctUntilChanged,
  filter,
} from 'rxjs/operators';

import { ApplicationService, AmplitudeService, HeaderService, } from '@services';
import { ApplicationModel, ProductModel, CategoryModel, HeaderFilterModel } from '@models';

import { Store, select } from '@ngrx/store';
import * as fromApp from '@store/app.reducer';
import * as SideMenuActions from '@store/side-menu/side-menu.actions';
import * as SearchSelectors from '@store/search/search.selectors';
import * as SearchActions from '@store/search/search.actions';
import * as _ from 'lodash';

const SEARCH_APPLICATION_KEYS = [
  'type',
  // 'title',
  'description',
  'application',
  'segment',
  'segment_type',
  'packed_goods',
  'product',
  // 'thickness',
  // 'width',
  // 'height',
  'production_process',
  'tipa_production_site',
  'features',
  'positive_experiments',
  'negative_feedback_to_be_aware_of',
  'available_marketing_samples',
  'customers',
];

const SEARCH_PRODUCT_KEYS = [
  'title',
  'description',
  'family',
  'segment',
  'thickness',
  'width',
  'height',
  'features',
];

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss'],
})
export class HeaderComponent implements OnInit, OnDestroy, AfterViewInit {
  @Output() searchResults = new EventEmitter();
  @ViewChild('search') searchElement: ElementRef;
  public searchForm: FormGroup;
  public hideInput: boolean;
  private isSideMenuHidden: boolean;
  private categories: CategoryModel[] = [];
  private products: ProductModel[] = [];

  private sideMenuSubscription: Subscription;
  private changedSubscription: Subscription;
  private categorySubscription: Subscription;
  private dataSubscription: Subscription;
  private filterEventSubscription: Subscription;
  private searchSubscription: Subscription;

  constructor(
    private router: Router,
    private store: Store<fromApp.AppState>,
    private formBuilder: FormBuilder,
    private amplitudeService: AmplitudeService,
    private applicationService: ApplicationService,
    private headerService: HeaderService,
  ) {
    this.searchForm = this.formBuilder.group({
      key: new FormControl(''),
      grouping: new FormControl(true), // true by default
    });
  }

  ngAfterViewInit() {
    if (this.router.url.includes('applications') || this.router.url.includes('products')) {
      this.searchElement.nativeElement.focus();
    }
  }

  ngOnInit() {
    this.initialHeaderFilter();
    this.formChangedEvent();
    this.listenFilterEvent();

    this.hideInput =
      this.router.url.includes('applications') ||
      this.router.url.includes('products') ||
      this.router.url.includes('product-info') ||
      this.router.url.includes('application-info');

    this.sideMenuSubscription = this.store
      .select('sideMenuHidden')
      .pipe(map((sideMenuState) => sideMenuState.sideMenuHidden))
      .subscribe((sideMenuHidden: boolean) => {
        this.isSideMenuHidden = sideMenuHidden;
      });

    this.categorySubscription = this.store
      .select('categories')
      .pipe(map((categoryState) => categoryState.categories))
      .subscribe((categories: CategoryModel[]) => {
        this.categories = categories;
      });

    this.searchSubscription = this.store
      .pipe(select(SearchSelectors.selectSearch))
      .subscribe(res => {
        this.searchForm.patchValue({key: res}, {emitEvent: true, onlySelf: true});
      });
  }

  ngOnDestroy() {
    if (this.changedSubscription) {
      this.changedSubscription.unsubscribe();
    }

    if (this.categorySubscription) {
      this.categorySubscription.unsubscribe();
    }

    if (this.dataSubscription) {
      this.dataSubscription.unsubscribe();
    }

    if (this.sideMenuSubscription) {
      this.sideMenuSubscription.unsubscribe();
    }

    if (this.filterEventSubscription) {
      this.filterEventSubscription.unsubscribe();
    }

    if (this.searchSubscription) {
      this.searchSubscription.unsubscribe();
    }
  }

  initialHeaderFilter() {
    let headerFilter: HeaderFilterModel = this.headerService.getHeaderFilter();

    if (headerFilter) {
      this.searchForm.patchValue(headerFilter, {emitEvent: true, onlySelf: true});
    }
  }

  onFocusSearch() {
    if (this.router.url.includes('product-info')) {
      this.router.navigate(['/products']);
    } else if (this.router.url.includes('application-info')) {
      this.router.navigate(['/applications']);
    }
  }

  formChangedEvent() {
    this.changedSubscription = this.searchForm.valueChanges
      .pipe(debounceTime(400), distinctUntilChanged())
      .subscribe((query: HeaderFilterModel) => {
        this.headerService.setHeaderFilter(query);
        this.store.dispatch(SearchActions.setSearch({payload: query.key}));

        if (query.key.length > 2) {
          this.amplitudeService.addNewEvent('Search event', {
            query,
          });
          this.dataSubscription = this.getAllItems().subscribe((result) => {
            const copyResult = result;
            copyResult.applications = copyResult.applications.filter(
              (application) =>
                this.searchByText(application.searchKey, query.key)
            );
            copyResult.products = copyResult.products.filter((product) =>
              this.searchByText(product.searchKey, query.key)
            );

            this.searchResults.emit(copyResult);
            this.applicationService.searchEvent.next(copyResult);
          });
        } else {
          this.searchResults.emit(null);
        }
      });
  }

  listenFilterEvent() {
    this.filterEventSubscription = this.applicationService.filterEvent.subscribe(
      (res) => {
        if (res) {
          // this.searchForm.get('key').setValue('', { emitEvent: false });
        }
      }
    );
  }

  getAllItems(): Observable<{
    products: ProductModel[];
    applications: ApplicationModel[];
  }> {
    const getProducts = this.store.select('products').pipe(
      filter((productStore) => productStore.allProductsLoaded),
      map((productStore) => productStore.allProducts),
      map((products) => {
        this.products = products;
        return products.map((product) => {
          const searchProduct = this.addSearchKey(product);
          return this.setProductSearch(searchProduct);
        });
      })
    );
    const getAppl = this.store.select('applications').pipe(
      filter((applicationState) => applicationState.allApplicationsLoaded),
      map((applicationState) => applicationState.applications),
      map((applications) =>
        applications.map((application) => {
          const searcApplication = this.addSearchKey(application);
          return this.setApplicationSearch(searcApplication);
        })
      )
    );

    return combineLatest([getProducts, getAppl]).pipe(
      map((value) => {
        return {
          products: value[0],
          applications: value[1],
        };
      })
    );
  }

  setProductSearch(product: ProductModel): ProductModel {
    _.forEach(SEARCH_PRODUCT_KEYS, (key) => {
      if (key === 'family' || key === 'segment') {
        product.searchKey = product.searchKey.concat(
          ', ',
          this.getCategoriesByIds(product[key])
        );
      } else {
        product.searchKey = product.searchKey.concat(', ', product[key]);
      }
    });

    return product;
  }

  setApplicationSearch(application: ApplicationModel): ApplicationModel {
    _.forEach(SEARCH_APPLICATION_KEYS, (key) => {
      if (key === 'product') {
        application.searchKey = application.searchKey.concat(
          this.getProductById(application[key])
        );
      } else if (key === 'type') {
        application.searchKey = application.searchKey.concat(
          ', ',
          this.getCategoriesByIds( [application[key]] )
        );
      } else if (
        key === 'application' ||
        key === 'segment' ||
        key === 'segment_type' ||
        key === 'packed_goods'
      ) {
        application.searchKey = application.searchKey.concat(
          ', ',
          this.getCategoriesByIds(application[key])
        );
      } else if( (key === 'available_marketing_samples' || key === 'customers') && Array.isArray(application[key]) ) {
        application[key].map(item => {
          application.searchKey = application.searchKey.concat(', ', item.description);
        });
      } else {
        application.searchKey = application.searchKey.concat(
          ', ',
          application[key]
        );
      }
    });

    return application;
  }

  getCategoriesByIds(ids: number[]): string {
    if (this.categories.length > 0) {
      return ids
        .map((id) => {
          let categoryItem = this.categories.find((category) => category.id === id);
          return (categoryItem) ? categoryItem.title : '';
        })
        .join(', ');
    } else {
      return '';
    }
  }

  getProductById(ids: number[]): string {
    if (this.products.length > 0) {
      return ids
        .map((id) => {
          let productItem = this.products.find((product) => product.id === id);
          return (productItem) ? productItem.title : '';
        })
        .join(', ');
    } else {
      return '';
    }
  }

  searchByText(searchKey: string, query: string): boolean {
    return _.includes(searchKey.toLowerCase(), query.toLowerCase());
  }

  addSearchKey(obj) {
    return {
      ...obj,
      searchKey: '',
    };
  }

  clearSearch() {
    this.store.dispatch(SearchActions.setSearch({payload: ''}));
  }

  goToProducts() {
    this.router.navigate(['products']);
  }

  expandSideMenu() {
    this.store.dispatch(
      new SideMenuActions.SetSidenavActive(!this.isSideMenuHidden)
    );
  }
}
