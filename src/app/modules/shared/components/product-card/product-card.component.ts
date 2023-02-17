import { Component, OnInit, OnDestroy, Input } from '@angular/core';
import { Router, Params, } from '@angular/router';
import { ProductModel, ApplicationModel, CategoryModel, StreamModel, FtItemsModel, StreamTypesModel, ApplicationInfoPageQueryParamsKeysModel, } from 'src/app/models';
import { AmplitudeService } from 'src/app/core/services';
import { map } from 'rxjs/operators';
import { Observable, Subscription } from 'rxjs';
import { ApplicationService, CategoryService, MultiSelectService } from '@services';

// Modals
import { BsModalService } from 'ngx-bootstrap/modal';
import { ModalPdfViewerComponent } from '../../modals/modal-pdf-viewer/modal-pdf-viewer.component';

import { Store } from '@ngrx/store';
import * as ComparisonActions from '@store/comparison/comparison.actions';
import * as fromApp from '@store/app.reducer';
import * as _ from 'lodash';

import { AppConstants } from '@core/app.constants';

@Component({
  selector: 'app-product-card',
  templateUrl: './product-card.component.html',
  styleUrls: ['./product-card.component.scss'],
})
export class ProductCardComponent implements OnInit, OnDestroy {
  public isCompared: Observable<boolean>;
  public applicationType: Observable<string>;
  @Input() productInfo: any;
  @Input() isProduct: boolean;

  private categoriesSubscription: Subscription;
  public applicationTypeInfo: CategoryModel;
  public applicationTypeList: any[] = [];
  public stageItemInfo;

  public applicationInfoPageQueryParamsKeys: ApplicationInfoPageQueryParamsKeysModel = this.applicationService.getApplicationInfoPageQueryParamsKeys();

  // Application streams
  public readonly streamTypes: StreamTypesModel = AppConstants.StreamTypes;
  public applicationStreamFastTrack: StreamModel;
  public applicationStreamStock: StreamModel;
  public applicationFtItemsValid: boolean;

  constructor(
    private store: Store<fromApp.AppState>,
    private router: Router,
    private modalService: BsModalService,
    private amplitudeService: AmplitudeService,
    private applicationService: ApplicationService,
    private categoryService: CategoryService,
    private multiSelectService: MultiSelectService
  ) {}

  ngOnInit() {
    this.isCompared = this.store
      .select('compareApplications')
      .pipe(
        map((compareState) =>
          compareState.compareApplications.includes(this.productInfo.id)
        )
      );

    this.getCategories();
    this.getApplicationStreams();

    if (this.productInfo && this.productInfo.stage) {
      this.stageItemInfo = AppConstants.StageItemList.find((item) => (item.id === this.productInfo.stage));
    }
  }

  ngOnDestroy() {
    if (this.categoriesSubscription) {
      this.categoriesSubscription.unsubscribe();
    }
  }

  getCategories() {
    this.applicationType = this.store
      .select('categories')
      .pipe(
        map((categoryState) =>
          this.categoryService.getApplicationTypeById(
            categoryState.categories,
            this.productInfo.application[0]
          )
        )
      );

    if (!this.isProduct && this.productInfo && this.productInfo['type']) {
      this.categoriesSubscription = this.store
      .select('categories')
      .pipe(map((categoryState) => categoryState.categories))
      .subscribe((categories: CategoryModel[]) => {
        // GET ApplicationTypeList
        const APPLICATION_TYPE = AppConstants.MainCategoryNames.APPLICATION_TYPE;
        let applicationTypeParent = categories
          .find((item) => (item.title === APPLICATION_TYPE.title && item.level === APPLICATION_TYPE.level) );
        if (applicationTypeParent) {
          this.applicationTypeList = this.multiSelectService.getDropdownById(
            categories,
            applicationTypeParent.id
          );
        }

        // GET applicationTypeInfo 
        if (this.applicationTypeList.length > 0) {
          this.applicationTypeInfo = this.applicationTypeList.find((item) => item.id === this.productInfo.type);
        }
      });
    }
  }

  getApplicationStreams() {
    if (this.isProduct) { return false; } // ONLY Application

    this.applicationStreamFastTrack = null;
    this.applicationStreamStock = null;
    this.applicationFtItemsValid = false;

    // Application Streams
    if (this.productInfo && this.productInfo.streams && this.productInfo.streams.length) {
      const streamTypes = AppConstants.StreamTypes;

      this.productInfo.streams
        .filter((item: StreamModel) => item.checked === true) // ONLY checked
        .map((item: StreamModel) => {
          if (item.type === streamTypes.FAST_TRACK) {
            this.applicationStreamFastTrack = item;
          } else if (item.type === streamTypes.STOCK) {
            this.applicationStreamStock = item;
          }
          return item;
        });
    }

    // Application Fast Track Items
    if (this.productInfo && this.productInfo.fast_track && Array.isArray(this.productInfo.fast_track.items)) {
      let validFtItems: FtItemsModel[] = _.cloneDeep(this.productInfo.fast_track.items).filter(item => (item && item.visible)); // only visible Fast Track Items
      this.applicationFtItemsValid = Boolean(validFtItems.length);
    }
  }

  openApplicationFtItems() {
    // should be only Application item
    if (!this.productInfo || this.isProduct) { return false; } // when Item is empty or is product

    let queryParams: ApplicationInfoPageQueryParamsKeysModel = {
      [this.applicationInfoPageQueryParamsKeys.tabIndex]: 1, // 1 because "Fast Track application" Tab is the index 1 of Tabs list, on the application-info page
    };
    
    this.viewProductInfo(queryParams);
  }

  openModalPdf(stream: StreamModel) {
    if (!stream) { return false; }
    if (!stream.file_url) { return false; }

    const config = {
      class: 'modal-pdf-viewer modal-dialog-centered',
      initialState: {
        pdfSrc: stream.file_url
      },
    };
    this.modalService.show(ModalPdfViewerComponent, config);
  }

  addCompare(productInfo) {
    this.store.dispatch(
      new ComparisonActions.AddCompareApplication(productInfo.id)
    );
  }

  deleteCompared(productInfo) {
    this.store.dispatch(
      new ComparisonActions.DeleteCompareApplication(productInfo.id)
    );
  }

  viewProductInfo(queryParams?: Params) {
    if (!this.productInfo) { return false; }

    this.router.navigate([
      this.isProduct ? 'product-info' : 'application-info',
      this.productInfo?.id,
    ], {
      queryParams: queryParams,
      queryParamsHandling: 'merge',
    });
    
    let title = (!this.isProduct && this.applicationTypeInfo)
      ? this.applicationTypeInfo?.title
      : this.productInfo?.title;

    this.amplitudeService.addNewEvent(
      this.isProduct ? 'View product' : 'View application',
      {
        id: this.productInfo?.id,
        title: title,
      }
    );
  }
}
