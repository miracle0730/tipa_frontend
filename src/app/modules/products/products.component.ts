import { Component, OnInit, OnDestroy, ViewChild, AfterViewInit, ElementRef } from '@angular/core';
import { Router, ActivatedRoute, Event, NavigationEnd, } from '@angular/router';
import { BsModalService, BsModalRef } from 'ngx-bootstrap/modal';
import { Subscription, Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ApplicationModel, CategoryModel, MultiSelectModel, ProductModel, ProductsFilterModel, HeaderFilterModel, } from '@models';
import { LoaderService, ProductService, HeaderService, } from '@services';
import { AddProductComponent } from '../shared/modals/add-product/add-product.component';

import { Store } from '@ngrx/store';
import * as fromApp from '@store/app.reducer';
import * as ProductActions from '@store/product/product.actions';
import * as ApplicationActions from '@store/application/application.actions';
import * as _ from 'lodash';

interface GroupedProductModel {
  category: CategoryModel;
  list: ProductModel[];
}

@Component({
  selector: 'app-products',
  templateUrl: './products.component.html',
  styleUrls: ['./products.component.scss'],
})
export class ProductsComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('containerEl') containerEl: ElementRef;
  public keptScrollY: number = 0;

  public bsModalRef: BsModalRef;
  private routerEventsSubscription: Subscription;
  private productsSubscription: Subscription;
  private categorySubscription: Subscription;
  private categories: CategoryModel[] = [];
  public isLoading: Observable<boolean>;
  private copyProducts: ProductModel[] = [];
  public productList: ProductModel[] = [];
  public searchedProductList: ProductModel[] = [];
  public applicationList: ApplicationModel[] = [];
  public searchedApplicationList: ApplicationModel[] = [];

  // Grouped products
  public groupedProductList: GroupedProductModel[] = [];
  public groupedProductInfo: GroupedProductModel;
  public keyGroupedCategoryId: string = 'groupedCategoryId'; // key for queryParams

  constructor(
    private router: Router,
    private activatedRoute: ActivatedRoute,
    private modalService: BsModalService,
    private store: Store<fromApp.AppState>,
    private loaderService: LoaderService,
    private productService: ProductService,
    private headerService: HeaderService,
  ) {}

  ngOnInit() {
    this.store.dispatch(new ApplicationActions.FetchApplications(false));
    this.store.dispatch(new ProductActions.FetchAllProducts());
    this.getRouterEvents();
    this.getCategories();

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
        // Grouping products
        this.getGroupedProductList();
      }
    });
  }

  getCategories() {
    this.categorySubscription = this.store
      .select('categories')
      .pipe(map((categoryState) => categoryState.categories))
      .subscribe((categories: CategoryModel[]) => {
        this.categories = categories;

        // GET Products after Categories
        this.getProducts();
      });
  }

  getProducts() {
    this.productsSubscription = this.store
      .select('products')
      .subscribe((productStore) => {
        // Kept scroll Y
        this.keptScrollY = (typeof productStore.keepScrollY === 'number') ? productStore.keepScrollY : 0;
        this.goToKeptScrollY();

        this.productList = this.getSortedProductList(productStore.allProducts, this.categories);
        this.copyProducts = _.cloneDeep(this.productList);
        this.searchedProductList = _.cloneDeep(this.productList);

        // Grouping products
        this.getGroupedProductList();
      });
  }

  ngOnDestroy() {
    this.keepScrollY();

    if (this.routerEventsSubscription) {
      this.routerEventsSubscription.unsubscribe();
    }

    if (this.productsSubscription) {
      this.productsSubscription.unsubscribe();
    }
    if (this.categorySubscription) {
      this.categorySubscription.unsubscribe();
    }
  }

  keepScrollY() {
    let scrollY: number = (this.containerEl) ? this.containerEl.nativeElement.scrollTop || 0 : 0;
    this.store.dispatch(new ProductActions.KeepScrollYProduct(scrollY));
  }

  goToKeptScrollY() {
    if (this.containerEl) {
      this.containerEl.nativeElement.scrollTop = (typeof this.keptScrollY === 'number') ? this.keptScrollY : 0;
    }
  }

  getSortedProductList(productList: ProductModel[], categoryList: CategoryModel[]): ProductModel[] {
    productList = (Array.isArray(productList)) ? _.cloneDeep([...productList]) : [];
    categoryList = (Array.isArray(categoryList)) ? _.cloneDeep([...categoryList]) : [];

    // Sort order by: 1-(Category Product Family display_priority), 2-(Category Product Family id), 3-(Product display_priority)
    let sortedProductList: ProductModel[] = _.orderBy(
      productList,
      [
        (item) => {
          let productFamily: CategoryModel = categoryList.find(categoryItem => (Array.isArray(item?.family) && item?.family?.length && categoryItem?.id === item?.family[0]) );
          return productFamily?.metadata?.product_family_display_priority || null;
        },
        (item) => {
          let productFamily: CategoryModel = categoryList.find(categoryItem => (Array.isArray(item?.family) && item?.family?.length && categoryItem?.id === item?.family[0]) );
          return productFamily?.id || null;
        },
        (item) => {
          return item?.display_priority || null;
        }
      ],
      ['asc', 'asc', 'asc']
    );

    return _.cloneDeep([...sortedProductList]);
  }

  searchResultEvent(results: {
    applications: ApplicationModel[];
    products: ProductModel[];
  }) {
    if (results) {
      this.productList = this.getSortedProductList(results.products, this.categories);
      this.applicationList = results.applications;
    } else {
      this.productList = this.copyProducts;
      this.applicationList = [];
    }

    // filtering products based on the search res
    this.searchedApplicationList = _.cloneDeep(this.applicationList);
    this.searchedProductList = _.cloneDeep(this.productList);
    const productsFilter: ProductsFilterModel = this.productService.getProductsFilter();
    this.productsFilterEvent(productsFilter);
  }

  openAddProductModal() {
    const config = {
      class: 'modal-lg modal-dialog-centered',
      initialState: {
        formData: null,
        isCreateModal: true,
      },
    };
    this.bsModalRef = this.modalService.show(AddProductComponent, config);
  }

  selectGroupedProductInfo(groupedItem?: GroupedProductModel) {
    let groupedItemId: number = (groupedItem && groupedItem.category && groupedItem.category.id) ? groupedItem.category.id : null;
    let foundGroupedItem: GroupedProductModel = (groupedItemId)
      ? this.groupedProductList.find(item => (item && item.category && item.category.id === groupedItemId) )
      : null;
    this.groupedProductInfo = (foundGroupedItem) ? foundGroupedItem : null;

    // IMPORTANT, current url should be 'products'. Because there is an additional method call
    if (this.router.url.includes('products')) { // IMPORTANT
      if (this.groupedProductInfo) { // SELECT group
        this.router.navigate([], { relativeTo: this.activatedRoute, queryParams: { [this.keyGroupedCategoryId]: this.groupedProductInfo.category.id }, queryParamsHandling: 'merge', replaceUrl: true });
      } else { // RESET group
        this.router.navigate([], { relativeTo: this.activatedRoute, queryParams: { [this.keyGroupedCategoryId]: null }, queryParamsHandling: 'merge', replaceUrl: true });
      }
    }

    // Scroll to top when is grouping
    let headerFilter: HeaderFilterModel = this.headerService.getHeaderFilter();
    if (headerFilter && headerFilter.grouping) {
      if (this.groupedProductInfo && this.containerEl) { // When are products of group
        this.containerEl.nativeElement.scrollTop = 0;
      }
    }
  }

  getGroupedProductList() {
    let headerFilter: HeaderFilterModel = this.headerService.getHeaderFilter();
    this.groupedProductList = []; // IMPORTANT reset by default

    // When products are empty
    if (!this.productList.length) { return false; }

    // Grouping
    if (headerFilter && headerFilter.grouping) {
      let objGrouped = _.groupBy(_.cloneDeep(this.productList), (item) => { // grouping by product family
        let foundCategory: CategoryModel = this.categories.find(categoryItem => ((item && item.family && item.family.length) && (categoryItem && categoryItem.id) && (item.family[0] === categoryItem.id)) );
        return (foundCategory) ? foundCategory.id : null;
      });

      let arrGrouped: GroupedProductModel[] = _.map(objGrouped, (value, key) => {
        let category: CategoryModel = this.categories.find(categoryItem => ((categoryItem && categoryItem.id) && (categoryItem.id === Number(key))) );
        let list: ProductModel[] = _.cloneDeep(value);

        return { category, list };
      });

      // Sorting groups by product_family_display_priority
      arrGrouped = _.orderBy(arrGrouped, (item) => {
        return item?.category?.metadata?.product_family_display_priority || null;
      }, ['asc']);

      this.groupedProductList = _.cloneDeep(arrGrouped).filter(item => (item && item.category && item.list.length) );
    }

    // Check and preselect group by keyGroupedCategoryId from queryParams
    let groupedCategoryId: number = Number(this.activatedRoute.snapshot.queryParams[this.keyGroupedCategoryId]);
    let foundGroupedItem: GroupedProductModel = (groupedCategoryId) ? this.groupedProductList.find(groupedItem => (groupedItem && groupedItem.category && groupedItem.category.id === groupedCategoryId) ) : null;
    
    if (foundGroupedItem) { // SELECT found group
      this.selectGroupedProductInfo(foundGroupedItem);
    } else { // RESET keyGroupedCategoryId from queryParams
      this.selectGroupedProductInfo();
    }
  }

  productsFilterEvent(productsFilter: ProductsFilterModel) {
    let filteredProductList: ProductModel[] = _.cloneDeep(this.searchedProductList) as ProductModel[];

    if (productsFilter && _.some(productsFilter, (propValue) => propValue.length > 0)) { // if filter is not empty
      if (productsFilter.stageListSelected && productsFilter.stageListSelected.length) {
        filteredProductList = this.makeStageProductsFilter(filteredProductList, productsFilter.stageListSelected);
      }

      if (productsFilter.territoryListSelected && productsFilter.territoryListSelected.length) {
          filteredProductList = this.makeTerritoryProductsFilter(filteredProductList, productsFilter.territoryListSelected);
      }

      this.productList = this.getSortedProductList(filteredProductList, this.categories);
      this.applicationList = [];
    } else { // values by default
      this.productList = _.cloneDeep(this.searchedProductList);
      this.applicationList = _.cloneDeep(this.searchedApplicationList);
    }

    // Grouping products
    this.getGroupedProductList();
  }

  makeStageProductsFilter(productList: ProductModel[], stageListSelected: MultiSelectModel[]): ProductModel[] {
    let selectedStage: MultiSelectModel = (stageListSelected && stageListSelected.length)
      ? stageListSelected[0] // single select
      : null;

    // return all products, if stage is not selected
    if (!selectedStage) { return productList; }

    return _.filter(productList, (product: ProductModel) => product.stage === selectedStage.id);
  }

    makeTerritoryProductsFilter(productList: ProductModel[], territoryListSelected: MultiSelectModel[]): ProductModel[] {
        let selectedTerritory: MultiSelectModel = (territoryListSelected && territoryListSelected.length)
            ? territoryListSelected[0] // single select
            : null;
        // let selectedTerritory: number[] = [];
        // for(var i in territoryListSelected){
        //     selectedTerritory.push(territoryListSelected[i].id);
        // }
        // console.log('SELECTED');
        // console.log(territoryListSelected);
        // console.log(selectedTerritory);
        // console.log(productList[0].available_territories[0]?.values.includes(selectedTerritory.title));
        // return all products, if stage is not selected
        if (!selectedTerritory) { return productList; }
        return _.filter(productList, (product: ProductModel) => {
          for(var i in product.available_territories){
            if(product.available_territories[i]?.values.includes(selectedTerritory.title))
              return true;
          }
        return false;});
    }
}
