import { Component, OnInit, OnDestroy, Input, } from '@angular/core';

// Services
import { AlertService, ProductService, CategoryService, } from '@services';

// Models
import { ApplicationModel, CategoryModel, FtItemsModel, ProductModel } from '@models';

// Libs
import { forkJoin, Observable, Subscription } from 'rxjs';
import * as _ from 'lodash';

interface MoqPerThicknessModel {
  thickness: number;
  moq: number;
}

interface GroupedFtItemsModel {
  shortCode: string;
  width: number;
  height: number;
  flap: number;
  gusset: number;
  dielineUrl: string;
  moqPerThickness: MoqPerThicknessModel[];
}

@Component({
  selector: 'app-application-fast-track',
  templateUrl: './application-fast-track.component.html',
  styleUrls: ['./application-fast-track.component.scss']
})
export class ApplicationFastTrackComponent implements OnInit, OnDestroy {
  // Input data
  @Input() applicationInfo: ApplicationModel;

  // Subscriptions
  public categoriesSubscription: Subscription;
  public productsSubscription: Subscription;
  public multiSubscription: Subscription;

  // General
  public productInfo: ProductModel;
  public applicationTypeInfo: CategoryModel;
  public packOrReelInfo: CategoryModel;
  public categories: CategoryModel[] = [];
  public products: ProductModel[] = [];
  public groupedFtItems: GroupedFtItemsModel[] = [];

  constructor(
    private alertService: AlertService,
    private productService: ProductService,
    private categoryService: CategoryService,
  ) { }

  ngOnInit(): void {
    if (this.applicationInfo) {
      this.initialMultiSubscription();
    }
  }

  ngOnDestroy() {
    if (this.categoriesSubscription) {
      this.categoriesSubscription.unsubscribe();
    }
    if (this.productsSubscription) {
      this.productsSubscription.unsubscribe();
    }
    if (this.multiSubscription) {
      this.multiSubscription.unsubscribe();
    }
  }

  initialMultiSubscription() {
    this.multiSubscription = forkJoin([this.getCategories(), this.getProducts()]).subscribe((res) => {
      // Initial data
      this.getProductInfo();
      this.getApplicationTypeInfo();
      this.getPackOrReelInfo();
      this.getGroupedFtItems();
    }, (err) => {
      this.alertService.showError('');
    });
  }

  getCategories() {
    return new Observable((observer) => {
      this.categoriesSubscription = this.categoryService.getCategories()
        .subscribe((categories: CategoryModel[]) => {
          this.categories = categories;

          // observer complete
          observer.next(this.categories);
          observer.complete();
        }, (err) => {
          // observer complete
          observer.error(err);
        });
    });
  }

  getProducts() {
    return new Observable((observer) => {
      this.productsSubscription = this.productService.getProducts()
        .subscribe((res) => {
          this.products = _.sortBy(res, (product) => product.title);

          // observer complete
          observer.next(this.products);
          observer.complete();
        }, (err) => {
          // observer complete
          observer.error(err);
        });
    });
  }

  getProductInfo() {
    this.productInfo = (this.applicationInfo && Array.isArray(this.applicationInfo.product) && this.applicationInfo.product.length)
      ? this.products.find(item => (item && item.id === this.applicationInfo.product[0]))
      : null;
  }

  getApplicationTypeInfo() {
    this.applicationTypeInfo = (this.applicationInfo)
      ? this.categories.find(item => item.id === this.applicationInfo.type)
      : null;
  }

  getPackOrReelInfo() {
    let appCategory: CategoryModel = (this.applicationInfo && Array.isArray(this.applicationInfo.application) && this.applicationInfo.application.length)
      ? this.categories.find(item => (item && item.id === this.applicationInfo.application[0]))
      : null;
    this.packOrReelInfo = (appCategory)
      ? this.categories.find(item => (item && item.id === appCategory.parent_id))
      : null;
  }

  getGroupedFtItems() {
    let validFtItems: FtItemsModel[] = (this.applicationInfo && this.applicationInfo.fast_track && Array.isArray(this.applicationInfo.fast_track.items))
      ? _.cloneDeep(this.applicationInfo.fast_track.items).filter(item => (item && item.visible)) // only visible Fast Track Items
      : [];

    let objGrouped = _.groupBy(_.cloneDeep(validFtItems), (item) => { // grouping by dimensions
      let thickness: string = String(item.thickness);
      let color: string = String(item.color);
      let code: string = String(item.code);
      let shortCode: string = code.substring(0, code.length - (thickness.length + color.length)); // code without [thickness] and [color]
      return shortCode;
    });

    let arrGrouped: GroupedFtItemsModel[] = _.map(objGrouped, (value, key) => {
      if (!value.length) { return null; } // when list is empty

      let shortCode: string = String(key);

      // first dimension item, because grouped items have the same dimension data
      let ftItemInfo: FtItemsModel = value[0];
      let width: number = ftItemInfo.dimension.width;
      let height: number = ftItemInfo.dimension.height;
      let flap: number = ftItemInfo.dimension.flap;
      let gusset: number = ftItemInfo.dimension.gusset;
      let dielineUrl: string = ftItemInfo.dimension.dieline_url;

      // moq per thickness
      let moqPerThickness: MoqPerThicknessModel[] = value.map(item => ({
        thickness: item.thickness,
        moq: item.moq
      })).filter(item => item);
      moqPerThickness = _.uniqBy(moqPerThickness, 'thickness'); // unique by thickness
      
      return {shortCode, width, height, flap, gusset, dielineUrl, moqPerThickness};
    });

    this.groupedFtItems = _.cloneDeep(arrGrouped);
  }
}
