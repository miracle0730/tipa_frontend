import {Component, OnInit, OnDestroy, ViewChild,} from '@angular/core';
import {
  FormGroup,
  FormBuilder,
  FormControl,
  FormArray,
  Validators,
} from '@angular/forms';

import {CdkDragDrop, moveItemInArray} from '@angular/cdk/drag-drop';

// ngx-bootstrap
import {BsModalRef} from 'ngx-bootstrap/modal';
import {TabsetComponent, TabDirective} from 'ngx-bootstrap/tabs';

import {
  ApplicationModel,
  CategoryModel,
  ProductModel,
  MultiSelectModel,
  ImageModel,
  ThicknessModel,
  CertificateModel,
  StreamModel,
  FtDimensionsModel,
  FtItemsModel,
  LevelOfClearanceModel,
  StageItemIdsModel,
  StageItem,
  CertificatesModel,
} from '@models';
import {
  ApplicationService,
  AlertService,
  MultiSelectService,
  FileService,
  AmplitudeService,
  ThicknessService,
} from '@services';

import {HttpErrorResponse} from '@angular/common/http';
import {IDropdownSettings} from 'ng-multiselect-dropdown';
import {distinctUntilChanged, map} from 'rxjs/operators';
import {Subscription} from 'rxjs';

import {Store} from '@ngrx/store';

import * as fromApp from '@store/app.reducer';
import * as ProductActions from '@store/product/product.actions';
import * as ApplicationActions from '@store/application/application.actions';
import * as ThicknessActions from '@store/thickness/thickness.actions';
import * as _ from 'lodash';

import {AppConstants} from '@core/app.constants';

enum SelectNextEnum {
  productFamilySelect = 1,
  packagingSelect = 2,
  segmentSelect = 3,
  segmentTypeSelect = 4,
  stageSelect = 5,
  applicationTypeSelect = 6,
}

enum SelectFieldEnum {
  thickness = 1,
  width = 2,
  height = 3,
  additionalFeatures = 4,
  dimensions = 5,
}

interface PhotosResponse {
  newImages: File[];
  oldImages: ImageModel[];
}

interface ThicknessFieldItem {
  values: any[];
  stage: number; // 0 | 1 | 2
  dataList?: any[];
}

interface AdditionalFeaturesFieldItem {
  ids: any[];
  stage: number; // 0 | 1 | 2
  mandatory: boolean;
  dataList?: any[];
}

interface WidthFieldItem {
  stage: string;
  min: number;
  max: number;
}

export interface FtItemsGroupedModel {
  visible: boolean;
  shortCode: string;
  fullItems: FtItemsModel[];
  dimension: FtDimensionsModel;
  thickness: number;
  moq: number;
  isCollapsed?: boolean;
}

@Component({
  selector: 'app-add-application',
  templateUrl: './add-application.component.html',
  styleUrls: ['./add-application.component.scss'],
})
export class AddApplicationComponent implements OnInit, OnDestroy {
  @ViewChild('staticTabs', {static: false}) staticTabs: TabsetComponent;

  private productsSubscription: Subscription;
  private categoriesSubscription: Subscription;
  private thicknessSubscription: Subscription;

  public isCreateModal: boolean;
  public formData: ApplicationModel;
  public applicationForm: FormGroup;
  public selectFieldEnum = SelectFieldEnum;
  public selectNextEnum = SelectNextEnum;

  public categories: CategoryModel[] = [];
  public productList: ProductModel[] = [];
  public selectedProductInfo: ProductModel;

  // Stage
  public stageItemIds: StageItemIdsModel = AppConstants.StageItemIds;
  public stageList: StageItem[] = _.cloneDeep(AppConstants.StageItemList);
  public availableStageList: StageItem[] = _.cloneDeep(AppConstants.StageItemList);
  public stageSelectedItems: any[] = [];

  // level_of_clearance
  public levelOfClearanceList: LevelOfClearanceModel[] = _.cloneDeep(AppConstants.LevelOfClearanceList);
  public availableLevelOfClearanceList: LevelOfClearanceModel[] = _.cloneDeep(AppConstants.LevelOfClearanceList);
  public levelOfClearanceIsVisible: boolean;

  // display_priority
  public displayPriorityList: number[] = _.cloneDeep(AppConstants.DisplayPriorityList);

  // Thickness
  public thicknessList: any[] = [];
  public thicknessFieldList: ThicknessFieldItem[] = [
    {values: [], stage: null}
  ];
  public ftThicknessFieldList: ThicknessFieldItem[] = [];

  // AdditionalFeatures
  public additionalFeaturesList: any[] = [];
  public additionalFeaturesFieldList: AdditionalFeaturesFieldItem[] = [
    {ids: [], stage: null, mandatory: false}
  ];
  public ftAdditionalFeaturesFieldList: AdditionalFeaturesFieldItem[] = [];

  // Number of printing colors
  public numberOfPrintingColorsList: number[] = [1, 2, 3, 4, 5, 6, 7, 8, 9];

  // Dimensions
  public ftDimensionsFieldList: FtDimensionsModel[] = [
    {size: 1, width: null, height: null, flap: null, gusset: null, dieline_url: ''}
  ];

  // Fast Track Items
  public ftItemsListGrouped: FtItemsGroupedModel[] = [];

  // Width
  public widthFieldList: WidthFieldItem[] = [
    {stage: null, min: null, max: null}
  ];

  // Height
  public heightFieldList: WidthFieldItem[] = [
    {stage: null, min: null, max: null}
  ];

  // Streams
  public streamList: StreamModel[] = [];

  // Old Certificates
  public getProductCertificatesInited: boolean;
  public certificates: CertificateModel[] = [];

  // Certificates
  public certifiedByList: CategoryModel[] = [];
  public availableApplicationCertificatesList: CategoryModel[] = [];
  public availableCertificateThicknessList: (number | string)[] = [];

  // ApplicationType
  public applicationTypeList: CategoryModel[] = [];
  public applicationTypeSelectedItems: any[] = [];

  public productFamily: CategoryModel[] = [];
  public productFiltered: ProductModel[] = [];
  public packagingList: CategoryModel[] = [];
  public applicationList: CategoryModel[] = [];
  public segmentList: CategoryModel[] = [];
  public segmentTypeList: CategoryModel[] = [];
  public packetGoodsList: CategoryModel[] = [];

  public productFamilySelected: MultiSelectModel[] = [];
  public productFilteredSelected: MultiSelectModel[] = [];
  public packagingListSelected: MultiSelectModel[] = [];
  public applicationSelected: MultiSelectModel[] = [];
  public segmentSelected: MultiSelectModel[] = [];
  public segmentTypeSelected: MultiSelectModel[] = [];
  public packetGoodsSelected: MultiSelectModel[] = [];

  public dropdownSettings: IDropdownSettings = {
    singleSelection: true,
    idField: 'id',
    textField: 'title',
    itemsShowLimit: 1,
    allowSearchFilter: false,
    enableCheckAll: false,
    closeDropDownOnSelection: true,
  };

  public singleSearchDropdownSettings: IDropdownSettings = _.cloneDeep({
    ...this.dropdownSettings,
    allowSearchFilter: true,
  });

  public multiDropdownSettings: IDropdownSettings = {
    singleSelection: false,
    idField: 'id',
    textField: 'title',
    itemsShowLimit: 1,
    allowSearchFilter: false,
    enableCheckAll: false,
  };

  // Partners List
  public partnersList: CategoryModel[] = [];

  // PrintingAvailableMethodList
  public printingAvailableMethodList: CategoryModel[] = [];
  public printingMethodAvailableFieldsList: ThicknessFieldItem[] = [
    {values: [], stage: null}
  ];

  public files: any[] = [];
  public dielineFile: File = null;
  public technicalConsiderationFile: File = null;
  public customersFiles: any[] = [];
  public availableMarketingSampleFiles: any[] = [];
  public newFiles: File[] = [];
  public customerPhotos: PhotosResponse[] = [];
  public availableMarketingSamplePhotos: PhotosResponse[] = [];
  public thicknessRequiredField = true;

  public productRequired: boolean;
  public applicationRequired: boolean;
  public segmentRequired: boolean;
  public segmentTypeRequired: boolean;
  public eventChangedProduct: boolean;
  public eventChangedApplication: boolean;
  public eventChangedSegment: boolean;
  public eventChangedSegmentType: boolean;
  public showFastTrack: boolean;

  constructor(
    private bsModalRef: BsModalRef,
    private formBuilder: FormBuilder,
    private store: Store<fromApp.AppState>,
    private applicationService: ApplicationService,
    private alertService: AlertService,
    private multiSelectService: MultiSelectService,
    private fileService: FileService,
    private amplitudeService: AmplitudeService,
    private thicknessService: ThicknessService,
  ) {
    // added form builder for
    // controlling every form control
    // and add custom validator if needed

    this.applicationForm = this.formBuilder.group({
      type: new FormControl('', [Validators.required]),
      stage: new FormControl('', [Validators.required]),
      level_of_clearance: new FormControl([]), // required is dynamic, when levelOfClearanceIsVisible
      display_priority: new FormControl([], [Validators.required]),
      description: new FormControl('', [Validators.required]),
      images: new FormArray([]),
      application: new FormArray([]),
      segment: new FormArray([]),
      segment_type: new FormArray([]),
      packed_goods: new FormArray([]),
      product: new FormArray([]),
      thickness: new FormControl('', [Validators.required]),
      width: new FormControl(''),
      height: new FormControl(''),
      additional_features: new FormControl(''),
      terms_and_limitations: new FormControl(''),
      production_process: new FormControl(''),
      tipa_production_site: new FormControl(''),
      technical_considerations: new FormGroup({
        description: new FormControl(''),
        url: new FormControl(''),
      }),
      features: new FormControl(''),
      positive_experiments: new FormControl(''),
      negative_feedback_to_be_aware_of: new FormControl(''),
      dieline: new FormGroup({
        url: new FormControl(''),
      }),
      customers: new FormArray([]),
      rtf: new FormControl(''),
      certifications: new FormArray([]),
      certificates: new FormArray([this.getInitialCertificatesItem()]),
      available_marketing_samples: new FormArray([]),
      draft: new FormControl(false),
      fast_track: new FormGroup({
        application_number: new FormControl(''),
        thickness: new FormControl([]),
        additional_features: new FormControl([]),
        number_of_printing_colors: new FormControl([]),
        production_site: new FormControl(''),
        dimensions: new FormControl([]),
        items: new FormControl([]),
      }),
      partner_name: new FormControl([]),
      notes_area: new FormControl(''),
      production_site: new FormControl(null),
      printing_method: new FormArray([]),
    });
  }

  ngOnInit() {
    this.store.dispatch(new ProductActions.FetchAllProducts());

    this.store
    .select('categories')
    .subscribe((categoryState) => {
      this.showFastTrack = categoryState.isShowFastTrack;
    });

    this.getCertificatesArray.valueChanges
      .pipe(distinctUntilChanged((x, y) => JSON.stringify(x) === JSON.stringify(y)))
      .subscribe(() => {
        // Need to update lists, because it's dynamic lists
        this.getCertificatesArray.controls.map(itemControl => {
          let certifiedByControl = itemControl?.get('certified_by');
          let certifiedByValue: CategoryModel[] = (certifiedByControl) ? certifiedByControl?.value || [] : [];
          let certificateControl = itemControl?.get('certificate');
          let certificateValueListValue: CategoryModel[] = (certificateControl?.get('value_list')) ? certificateControl?.get('value_list')?.value || [] : [];

          let preselectDataList: CategoryModel[] = this.availableApplicationCertificatesList.filter(item => {
            return (Array.isArray(certifiedByValue) && certifiedByValue.length)
              ? certifiedByValue.find(item2 => {
                let certificateCategory: CategoryModel = this.categories.find(category => category?.id === item?.id);
                return item2?.id === certificateCategory?.metadata?.certificate_certified_by;
              })
              : true;
          });

          let preselectValueList: CategoryModel[] = (Array.isArray(certificateValueListValue))
            ? certificateValueListValue.filter(item => preselectDataList.find(item2 => item?.id === item2?.id))
            : [];

          if (certificateControl) {
            certificateControl?.patchValue({
              data_list: preselectDataList,
              value_list: preselectValueList,
            });
          }

          return itemControl;
        });
      });

    this.getThickness();
  }

  getPrintingAvailableMethodList() {
    const PRINTING_METHOD = AppConstants.MainCategoryNames.PRINTING_METHOD;
    const printingAvailableMethodList: CategoryModel = (this.categories)
      ? this.categories.find((category) => (category.title === PRINTING_METHOD.title && category.level === PRINTING_METHOD.level))
      : null;

    // GET printingAvailableMethod
    this.printingAvailableMethodList = (printingAvailableMethodList)
      ? this.multiSelectService.getDropdownById(this.categories, printingAvailableMethodList.id)
      : [];
  }

  getThickness() {
    this.thicknessService.getThickness().subscribe((thickness: ThicknessModel[]) => {
      this.thicknessList = [...thickness];

      if (this.formData) {
        // SET thicknessFieldList
        if (this.formData.thickness.length > 0 && this.thicknessList.length > 0) {
          this.thicknessFieldList = JSON.parse(JSON.stringify(this.formData.thickness))
            .filter((item) => {
              item.values = item.values.filter((el) => (typeof el === 'number') ? el : false);
              return item;
            })
            .map((thickness) => {
              thickness.values = thickness.values.map((value) => {
                return this.thicknessList.find((item) => item.value === value);
              });
              return thickness;
            })
            .filter((item) => {
              item.values = item.values.filter((el) => (el) ? el : false);
              return item;
            });
        }

        // SET Fast Track thickness
        if (this.formData.fast_track.thickness.length > 0) {
          this.ftThicknessFieldList = JSON.parse(JSON.stringify(this.formData.fast_track.thickness))
            .filter((item) => {
              item.values = item.values.filter((el) => (typeof el === 'number') ? el : false);
              return item;
            })
            .map((thickness) => {
              thickness.dataList = [];
              thickness.values = thickness.values.map((value) => {
                return this.thicknessList.find((item) => item.value === value);
              });
              return thickness;
            })
            .filter((item) => {
              item.values = item.values.filter((el) => (el) ? el : false);
              return item;
            });
        }

        this.setFieldStatus(this.selectFieldEnum.thickness);
      }

      // GET data lists
      this.getProducts();
      this.getAvailableCertificateThicknessList();
    });
  }

  getProducts() {
    this.productsSubscription = this.store
      .select('products')
      .subscribe((productState) => {
        if (productState.allProductsLoaded) {
          this.productList = productState.allProducts;
          this.getCategories();
        }
      });
  }

  getPartners() {
    const PARTNERS = AppConstants.MainCategoryNames.PARTNERS;
    const partnersList: CategoryModel = (this.categories)
      ? this.categories.find((category) => (category.title === PARTNERS.title && category.level === PARTNERS.level))
      : null;

    // GET Partners
    this.partnersList = (partnersList)
      ? this.multiSelectService.getDropdownById(this.categories, partnersList.id)
      : [];
  }

  getCategories() {
      this.segmentRequired = true;
    this.categoriesSubscription = this.store
      .select('categories')
      .pipe(map((categoryState) => categoryState.categories))
      .subscribe((categories: CategoryModel[]) => {
        this.categories = categories;

        // GET data lists
        this.getCertifiedByList();
        this.getAvailableApplicationCertificatesList();
        this.getPartners();
        this.getPrintingAvailableMethodList();

        // GET ApplicationTypeList
        const APPLICATION_TYPE = AppConstants.MainCategoryNames.APPLICATION_TYPE;
        let applicationTypeParent = this.categories
          .find((item) => (item.title === APPLICATION_TYPE.title && item.level === APPLICATION_TYPE.level));
        if (applicationTypeParent) {
          this.applicationTypeList = this.multiSelectService.getDropdownById(
            categories,
            applicationTypeParent.id
          );
        }

        // GET AdditionalFeaturesList
        const ADDITIONAL_FEATURES = AppConstants.MainCategoryNames.ADDITIONAL_FEATURES;
        let additionalFeaturesParent = this.categories
          .find((item) => (item.title === ADDITIONAL_FEATURES.title && item.level === ADDITIONAL_FEATURES.level));
        if (additionalFeaturesParent) {
          let secondLevelList = this.multiSelectService.getDropdownById(
            categories,
            additionalFeaturesParent.id
          );

          let thirdLevelList = secondLevelList.map((parent) => {
            return this.multiSelectService.getDropdownById(categories, parent.id);
          });

          thirdLevelList.map(arr => this.additionalFeaturesList.push(...arr));
        }

        this.productFamily = this.multiSelectService.getDropdownById(
          categories,
          2
        );
        this.packagingList = this.multiSelectService.getDropdownById(
          categories,
          1
        );
        this.segmentList = this.multiSelectService.getDropdownById(
          categories,
          3
        );

        // GET Streams
        this.getStreamList();

        if (this.formData) {
          this.files = [...this.formData.images];
          this.dielineFile =
            this.formData && this.formData.dieline
              ? this.formData.dieline.url
              : null;
          this.technicalConsiderationFile =
            this.formData && this.formData.technical_considerations
              ? this.formData.technical_considerations.url
              : null;
          this.customersFiles = _.cloneDeep(this.formData.customers);
          this.availableMarketingSampleFiles = _.cloneDeep(this.formData.available_marketing_samples);
          // level_of_clearance
          let foundLevelOfClearanceItem: LevelOfClearanceModel = (this.formData.level_of_clearance)
            ? this.levelOfClearanceList.find(item => (item && item.id === this.formData.level_of_clearance))
            : null;
          let preselectLevelOfClearance: LevelOfClearanceModel[] = (foundLevelOfClearanceItem) ? [foundLevelOfClearanceItem] : [];

          // partner_name
          const preselectPartnerName: CategoryModel[] = this.multiSelectService.preselectOptions(
            this.formData.partner_name,
            categories
          );

          this.applicationForm.get('production_site').setValue(this.formData.production_site);
          this.applicationForm.get('notes_area').setValue(this.formData.notes_area);

          this.applicationForm.patchValue({
            ...this.formData,
            certificates: [],
            level_of_clearance: preselectLevelOfClearance,
            display_priority: (this.formData.display_priority && this.displayPriorityList.find(item => item === this.formData.display_priority)) ? [this.formData.display_priority] : [5], // 5 as default
            dieline: this.formData.dieline || {},
            technical_considerations: this.formData.technical_considerations || {},
            fast_track: this.formData.fast_track || {},
            partner_name: (preselectPartnerName && Array.isArray(preselectPartnerName)) ? preselectPartnerName : [],
          });

          // certificates
          this.preselectCertificatesArray(this.formData.certificates);

          this.preselectProductDropdown();
          this.preselectApplicationDropdown();
          this.preselectSegmentDropdown();
          this.formData.customers.forEach((customer) => {
            this.getCustomers.push(
              new FormGroup({
                images: new FormArray([]),
                description: new FormControl(customer.description),
              })
            );
          });
          this.formData.available_marketing_samples.forEach((sample) => {
            this.getAvailableMarketingSamples.push(
              new FormGroup({
                images: new FormArray([]),
                description: new FormControl(sample.description),
              })
            );
          });
          this.checkDropdownRequired(1);
          this.checkDropdownRequired(2);
          this.checkDropdownRequired(3);
          this.checkDropdownRequired(4);

          // SET applicationTypeSelectedItems
          if (this.applicationTypeList.length > 0) {
            let found = this.applicationTypeList.find((item) => (item.id === this.formData.type));
            (found) ? this.applicationTypeSelectedItems = [found] : null;
          }
          this.setNextDropdownValues(null, 6);

          // SET stageSelectedItems
          if (this.stageList.length > 0) {
            let found = this.stageList.find((item) => (item.id === this.formData.stage));
            (found) ? this.stageSelectedItems = [found] : null;
          }
          this.setNextDropdownValues(null, 5);

          // SET widthFieldList
          if (this.formData.width.length > 0) {
            this.widthFieldList = JSON.parse(JSON.stringify(this.formData.width)).map((item) => item);
          }
          this.setFieldStatus(this.selectFieldEnum.width);

          // SET heightFieldList
          if (this.formData.height.length > 0) {
            this.heightFieldList = JSON.parse(JSON.stringify(this.formData.height)).map((item) => item);
          }
          this.setFieldStatus(this.selectFieldEnum.height);

          // SET additionalFeaturesFieldList
          if (this.formData.additional_features.length > 0 && this.additionalFeaturesList.length > 0) {
            this.additionalFeaturesFieldList = JSON.parse(JSON.stringify(this.formData.additional_features))
              .filter((item) => {
                item.ids = item.ids.filter((el) => (typeof el === 'number') ? el : false);
                return item;
              })
              .map((item) => {
                item.ids = item.ids.map((id) => {
                  return this.additionalFeaturesList.find((obj) => obj.id === id);
                });
                return item;
              })
              .filter((item) => {
                item.ids = item.ids.filter((el) => (el) ? el : false);
                return (item.ids.length > 0);
              });

            // If array is empty, set first item
            if (!this.additionalFeaturesFieldList.length) {
              this.additionalFeaturesFieldList.push({ids: [], stage: null, mandatory: false});
            }
          }
          if (this.formData.fast_track.additional_features.length > 0) {
            this.ftAdditionalFeaturesFieldList = JSON.parse(JSON.stringify(this.formData.fast_track.additional_features))
              .filter((item) => {
                item.ids = item.ids.filter((el) => (typeof el === 'number') ? el : false);
                return item;
              })
              .map((item) => {
                item.ids = item.ids.map((id) => {
                  return this.additionalFeaturesList.find((obj) => obj.id === id);
                });
                return item;
              })
              .filter((item) => {
                item.ids = item.ids.filter((el) => (el) ? el : false);
                return (item.ids.length > 0);
              });
          }
          this.setFieldStatus(this.selectFieldEnum.additionalFeatures);

          // printing_method
          if (this.formData.printing_method && this.formData.printing_method.length) {
            this.printingMethodAvailableFieldsList = JSON.parse(JSON.stringify(this.formData.printing_method))
              .filter((item) => {
                item.values = item.values.filter((el) => (typeof el === 'string') ? el : false);
                return item;
              })
              .map((item) => {
                item.values = item.values.map((title) => {
                  return this.printingAvailableMethodList.find((obj) => obj.title === title);
                });
                return item;
              })
              .filter((item) => {
                item.values = item.values.filter((el) => (el) ? el : false);
                return (item.values.length > 0);
              });

            // If array is empty, set first item
            if (!this.printingMethodAvailableFieldsList.length) {
              this.printingMethodAvailableFieldsList.push({values: [], stage: null});
            }
          }
          // SET Dimensions
          if (this.formData.fast_track && this.formData.fast_track.dimensions.length) {
            this.ftDimensionsFieldList = _.cloneDeep(this.formData.fast_track.dimensions);
          }

          // Fast Track Items
          let ftItemsList: FtItemsModel[] = (this.formData.fast_track && this.formData.fast_track.items) ? _.cloneDeep(this.formData.fast_track.items) : [];
          if (Array.isArray(ftItemsList) && ftItemsList.length) {
            this.ftItemsListGrouped = this.getGeneratedFtItems(ftItemsList);
          }
        } else {
          // Default values
          this.applicationForm?.get('display_priority')?.setValue([5], {emitEvent: false});
        }
      });

  }

  getMultiDropdownSettings(newSettings?: IDropdownSettings) {
    return Object.assign({}, this.multiDropdownSettings, newSettings);
  }

  getTypeofNumber(value): boolean {
    return (typeof value === 'number' && value >= 0);
  }

  getStreamList() {
    this.streamList = AppConstants.StreamList
      .filter(item => item.type !== 'custom') // without custom stream
      .map(item => ({
        ...item,
        file_url: null,
        site_url: null,
        checked: false,
      }));

    if (this.formData && this.formData.streams && this.formData.streams.length) {
      this.streamList = this.streamList
        .map(item => {
          let foundStream = this.formData.streams.find(stream => item.type === stream.type);

          return (foundStream)
            ? {...item, ...foundStream} // merged stream
            : item; // empty stream
        });
    }
  }

  addStreamFile(file: FileList, stream: StreamModel) {
    stream.file_url = file[0];
  }

  deleteStreamFile(stream: StreamModel) {
    stream.file_url = null;
  }

  getSelectedProductInfo() {
    let selectedProduct: MultiSelectModel = (this.productFilteredSelected.length) ? this.productFilteredSelected[0] : null; // Single select
    this.selectedProductInfo = (this.productList.length && selectedProduct)
      ? this.productList.find(product => product.id === selectedProduct.id)
      : null;

    // GET data
    this.getAvailableStageList();
    this.getAvailableLevelOfClearanceList();
    this.getProductRtf();
    this.getProductCertificates();
  }

  getAvailableStageList() {
    let foundStageItem: StageItem = (this.selectedProductInfo?.stage) ? this.stageList.find(item => item?.id === this.selectedProductInfo?.stage) : null;
    this.availableStageList = (foundStageItem) ? this.stageList.filter(item => item?.level >= foundStageItem?.level) : _.cloneDeep(this.stageList);

    // Emit change stage
    this.setNextDropdownValues(null, this.selectNextEnum?.stageSelect);
  }

  getAvailableLevelOfClearanceList() {
    let foundLevelOfClearanceItem: LevelOfClearanceModel = (this.selectedProductInfo?.level_of_clearance) ? this.levelOfClearanceList.find(item => item?.id === this.selectedProductInfo?.level_of_clearance) : null;
    this.availableLevelOfClearanceList = (foundLevelOfClearanceItem) ? this.levelOfClearanceList.filter(item => item?.level >= foundLevelOfClearanceItem?.level) : _.cloneDeep(this.levelOfClearanceList);

    // Emit change level_of_clearance
    this.preselectLevelOfClearance();
  }

  preselectLevelOfClearance() {
    let levelOfClearanceControl = this.applicationForm.get('level_of_clearance');
    let levelOfClearanceValue: LevelOfClearanceModel[] = (levelOfClearanceControl) ? _.cloneDeep(levelOfClearanceControl.value) : [];

    let preselectLevelOfClearanceValue: LevelOfClearanceModel[] = levelOfClearanceValue
      .filter(item => this.availableLevelOfClearanceList.find(elem => item?.id === elem?.id));

    if (levelOfClearanceControl) {
      levelOfClearanceControl.setValue(preselectLevelOfClearanceValue, {emitEvent: false});
      levelOfClearanceControl.markAsPristine();
      levelOfClearanceControl.markAsTouched();
    }
  }

  getProductRtf() {
    let applicationRtfControl = this.applicationForm.get('rtf');
    let applicationRtfValue = applicationRtfControl.value;

    // if application rtf field is empty, it should be set automatically from the Product
    if (!applicationRtfValue && this.selectedProductInfo && this.selectedProductInfo.rtf) {
      applicationRtfControl.setValue(this.selectedProductInfo.rtf);
    }
  }

  getProductCertificates() {
    this.certificates = [];

    if (!this.selectedProductInfo || !this.selectedProductInfo.certifications.length) {
      return true;
    }

    // IMPORTANT after init, application's certificates should be empty
    let applicationCertList: CertificateModel[] = (!this.getProductCertificatesInited && this.formData && this.formData.certifications.length)
      ? [...this.formData.certifications]
      : [];

    this.certificates = this.selectedProductInfo.certifications
      .map(item => {
        let productCert: CertificateModel = _.cloneDeep(item);
        let productCertCategory: CategoryModel = (productCert && productCert.category_id)
          ? this.categories.find(certCategory => certCategory.id === productCert.category_id)
          : null;

        if (!productCert || !productCertCategory) {
          return null;
        }

        productCert.title = productCertCategory.title;
        productCert.type = (productCertCategory.metadata && productCertCategory.metadata.certification_type)
          ? productCertCategory.metadata.certification_type
          : '';
        productCert.logo = (productCertCategory.metadata && productCertCategory.metadata.certification_logo)
          ? productCertCategory.metadata.certification_logo
          : '';

        let applicationCert: CertificateModel = (applicationCertList.length)
          ? applicationCertList.find(appCert => (appCert && appCert.category_id) && (productCert && productCert.category_id) && (appCert.category_id === productCert.category_id))
          : null;

        let checked: boolean = (applicationCertList.length && !applicationCert) ? false : true; // true by default
        let download: boolean = (applicationCert && applicationCert.hasOwnProperty('download'))
          ? applicationCert.download
          : (productCert.hasOwnProperty('download')) ? productCert.download : false;
        let disabled: boolean = false;

        if (productCert.hasOwnProperty('download') && productCert.download === false) {
          download = false;
          disabled = true;
        }

        return ({
          ...productCert,
          download,
          disabled,
          checked,
        });
      })
      .filter(item => item);

    // IMPORTANT after init, application's certificates should be empty
    this.getProductCertificatesInited = true;
  }

  getSelectedCertificates(): CertificateModel[] {
    return JSON.parse(JSON.stringify(this.certificates))
      .filter((item) => item.checked === true)
      .map((item: CertificateModel) => {
        const http = 'http://';
        const https = 'https://';

        // send only file name to backend
        let parsedFileUrl: string = (item.file_url && typeof item.file_url === 'string' && (item.file_url.includes(http) || item.file_url.includes(https)))
          ? JSON.parse(JSON.stringify(item.file_url)).split('/').pop()
          : item.file_url;

        return {
          category_id: item.category_id,
          description: item.description,
          file_url: parsedFileUrl,
          download: item.download,
        };
      });
  }

  get getIndustrialCertificates() {
    return this.certificates.filter((item) => (item && item.type && item.type === AppConstants.CertificationTypeNames.INDUSTRIAL));
  }

  get getHomeCertificates() {
    return this.certificates.filter((item) => (item && item.type && item.type === AppConstants.CertificationTypeNames.HOME));
  }

  getValidMinMax(min, max): boolean {
    if (
      (!min && !max) ||
      (this.getTypeofNumber(min) && this.getTypeofNumber(max))
    ) {
      return true;
    } else {
      return false;
    }
  }

  generateFtItems() {
    // Validation FT fields
    let isValidFtFields: boolean = this.getIsValidFtFields();
    if (isValidFtFields) { // Generate items
      this.ftItemsListGrouped = this.getGeneratedFtItems();
    } else { // Reset items
      this.ftItemsListGrouped = [];
    }
  }

  getIsEqualFtItems(): boolean {
    let copyFtItemsListGrouped: FtItemsGroupedModel[] = _.cloneDeep(this.ftItemsListGrouped);
    let newFtItemsListGrouped: FtItemsGroupedModel[] = [];
    let isValidFtFields: boolean = this.getIsValidFtFields(true);

    if (isValidFtFields) {
      newFtItemsListGrouped = this.getGeneratedFtItems();
    } else {
      newFtItemsListGrouped = [];
    }

    // IMPORTANT check only required fields, short data
    const getShortFtItemsList = (ftItemsListGrouped: FtItemsGroupedModel[]): any[] => {
      return ftItemsListGrouped.map(group => {
        let shortCode: string = group.shortCode;
        let codes: string[] = group.fullItems.map(item => item.code);
        let dimension = group.dimension;
        let thickness: number = group.thickness;

        return {
          shortCode,
          codes,
          dimension,
          thickness
        };
      });
    }
    let shortCopyFtItemsListGrouped = getShortFtItemsList(copyFtItemsListGrouped);
    let shortNewFtItemsListGrouped = getShortFtItemsList(newFtItemsListGrouped);

    // IMPORTANT check only short items arrays
    let isEqual: boolean = _.isEqual(shortCopyFtItemsListGrouped, shortNewFtItemsListGrouped);
    (isEqual) ? 'OK' : this.alertService.showError('Fast Track fields were changed, please Update Items');

    return isEqual;
  }

  getIsValidFtFields(hideErrorMessage?: boolean): boolean {
    let fastTrackControl = this.applicationForm.get('fast_track');
    let appNumberControl = (fastTrackControl) ? fastTrackControl.get('application_number') : null;
    let colorsControl = (fastTrackControl) ? fastTrackControl.get('number_of_printing_colors') : null;

    let copyAppNumber: string = (appNumberControl) ? appNumberControl.value : '';
    let copyFtThicknessFieldList: ThicknessFieldItem[] = _.cloneDeep(this.ftThicknessFieldList || []);
    let copyFtDimensionsFieldList: FtDimensionsModel[] = _.cloneDeep(this.ftDimensionsFieldList || []);
    let copyFtColorsList: number[] = (colorsControl) ? _.cloneDeep(colorsControl.value || []) : [];

    const errorHandler = (message: string) => {
      if (!hideErrorMessage) { // show by default
        this.alertService.showError(message);
      }
    }

    // Application Number
    let copyAppNumberValid: boolean = Boolean(appNumberControl && appNumberControl.valid && copyAppNumber); // shouldn't be empty or invalid
    if (!copyAppNumberValid) {
      errorHandler("Please fill in the Application Number field");
      return false;
    }

    // Thickness
    let copyFtThicknessFieldListValid: boolean = (Array.isArray(copyFtThicknessFieldList) && copyFtThicknessFieldList.length)
      ? Boolean(copyFtThicknessFieldList.find(field => field.values.length))
      : false;
    if (!copyFtThicknessFieldListValid) {
      errorHandler("Please fill in the Thickness field");
      return false;
    }

    // Colors
    let copyFtColorsListValid: boolean = Boolean(Array.isArray(copyFtColorsList) && copyFtColorsList.length);
    if (!copyFtColorsListValid) {
      errorHandler("Please fill in the Colors field");
      return false;
    }

    // Dimensions
    let copyFtDimensionsFieldListInvalid: boolean = (Array.isArray(copyFtDimensionsFieldList) && copyFtDimensionsFieldList.length)
      ? Boolean(copyFtDimensionsFieldList.find(item => !item.width || !item.height))
      : true;
    if (copyFtDimensionsFieldListInvalid) {
      errorHandler("Please fill in each Width and Height fields for Dimensions");
      return false;
    }

    return true;
  }

  resetFastTrackData() {
    let fastTrackControl = this.applicationForm.get('fast_track');

    if (fastTrackControl) {
      // RESET application_number
      let applicationNumberControl = fastTrackControl.get('application_number');
      (applicationNumberControl) ? applicationNumberControl.setValue('', {emitEvent: false}) : null;

      // RESET thickness
      let thicknessControl = fastTrackControl.get('thickness');
      (thicknessControl) ? thicknessControl.setValue([], {emitEvent: false}) : null;
      this.ftThicknessFieldList = this.ftThicknessFieldList.map(item => {
        item.values = [];
        return item;
      });

      // RESET number_of_printing_colors
      let numberOfPrintingColorsControl = fastTrackControl.get('number_of_printing_colors');
      (numberOfPrintingColorsControl) ? numberOfPrintingColorsControl.setValue([], {emitEvent: false}) : null;

      // RESET additional_features
      let additionalFeaturesControl = fastTrackControl.get('additional_features');
      (additionalFeaturesControl) ? additionalFeaturesControl.setValue([], {emitEvent: false}) : null;
      this.ftAdditionalFeaturesFieldList = this.ftAdditionalFeaturesFieldList.map(item => {
        item.ids = [];
        item.mandatory = false;
        return item;
      });

      // RESET production_site
      let productionSiteControl = fastTrackControl.get('production_site');
      (productionSiteControl) ? productionSiteControl.setValue('', {emitEvent: false}) : null;

      // RESET dimensions
      let dimensionsControl = fastTrackControl.get('dimensions');
      (dimensionsControl) ? dimensionsControl.setValue([], {emitEvent: false}) : null;
      this.ftDimensionsFieldList = [
        {size: 1, width: null, height: null, flap: null, gusset: null, dieline_url: ''}
      ];

      // RESET items
      let itemsControl = fastTrackControl.get('items');
      (itemsControl) ? itemsControl.setValue([], {emitEvent: false}) : null;
      this.ftItemsListGrouped = [];
    }
  }

  getGeneratedFtItems(preselectFtItemsList?: FtItemsModel[]): FtItemsGroupedModel[] {
    let isPreselectFtItemsList: boolean = Boolean(Array.isArray(preselectFtItemsList) && preselectFtItemsList.length); // when is preselecting items

    let fastTrackControl = this.applicationForm.get('fast_track');
    let appNumberControl = (fastTrackControl) ? fastTrackControl.get('application_number') : null;
    let colorsControl = (fastTrackControl) ? fastTrackControl.get('number_of_printing_colors') : null;

    let copyFtItemsListGrouped: FtItemsGroupedModel[] = _.cloneDeep(this.ftItemsListGrouped || []);
    let copyAppNumber: string = (appNumberControl) ? appNumberControl.value : '';
    let copyFtThicknessFieldList: ThicknessFieldItem[] = _.cloneDeep(this.ftThicknessFieldList || []);
    let copyFtDimensionsFieldList: FtDimensionsModel[] = _.cloneDeep(this.ftDimensionsFieldList || []);
    let copyFtColorsList: number[] = (colorsControl) ? _.cloneDeep(colorsControl.value || []) : [];
    let ftItemsList: FtItemsModel[] = [];

    // generate the all items
    if (isPreselectFtItemsList) { // PRESELECT
      ftItemsList = _.cloneDeep(preselectFtItemsList);
    } else { // GENERATE by default
      // Thickness unique
      let uniqueThicknessValuesList: any[] = [];
      copyFtThicknessFieldList.map(eField => {
        uniqueThicknessValuesList = [...uniqueThicknessValuesList, ...eField.values];
        return eField;
      });
      uniqueThicknessValuesList = _.uniqBy(uniqueThicknessValuesList, 'value') // unique by value

      uniqueThicknessValuesList.map(thicknessItem => {
        copyFtDimensionsFieldList.map(dimensionItem => {
          copyFtColorsList.map(colorItem => {
            let generateItem: FtItemsModel = {
              visible: false,
              code: `FT${copyAppNumber}${dimensionItem.size}${thicknessItem.value}${colorItem}`, // code must be unique -> FT[Application Number][Size Number from Demensions][Thickness value][Number of Colors]
              dimension: {...dimensionItem},
              thickness: thicknessItem.value,
              color: colorItem,
              moq: null,
            };

            ftItemsList.push(generateItem);
          });
        });
      });
    }

    let objGrouped = _.groupBy(_.cloneDeep(ftItemsList), (item) => {
      let color: string = String(item.color);
      let code: string = item.code;
      let codeWithoutColor: string = code.substring(0, code.length - color.length);
      return codeWithoutColor;
    });

    let arrGrouped: FtItemsGroupedModel[] = _.map(objGrouped, (value, key) => {
      let itemValue = (value && value.length) ? value[0] : null; // first item [0], because dimension, thickness are the same
      if (!itemValue) {
        return null;
      } // when item is absent

      let shortCode: string = key;
      let foundFtItemGrouped = copyFtItemsListGrouped.find(ftItemGrouped => ftItemGrouped.shortCode === shortCode); // find old item by shortCode
      let visible: boolean = false; // by default
      let moq: number = null; // by default

      if (isPreselectFtItemsList) { // set data from full item
        visible = itemValue.visible;
        moq = itemValue.moq;
      } else { // set data from found grouped item
        if (foundFtItemGrouped) {
          visible = foundFtItemGrouped.visible;
          moq = foundFtItemGrouped.moq;
        }
      }

      // need rewrite only (visible and moq) values for each item
      value = value.map(fullItem => {
        fullItem.visible = visible;
        fullItem.moq = moq;

        return fullItem;
      });

      return ({
        visible: visible,
        shortCode: shortCode,
        fullItems: [...value],
        dimension: itemValue.dimension,
        thickness: itemValue.thickness,
        moq: moq,
        isCollapsed: false,
      });
    });
    arrGrouped = arrGrouped.filter(item => item);

    return _.cloneDeep(arrGrouped);
  }

  toggleAllFtItems() {
    let newVisible: boolean = true; // by default
    let objGrouped = _.groupBy(_.cloneDeep(this.ftItemsListGrouped), 'visible');
    let arrGrouped: string[] = _.map(objGrouped, (value, key) => key);

    if (arrGrouped.length && arrGrouped.length === 1) { // when there are the same visible value
      let groupedVisibleValue: string = arrGrouped[0]; // value - 'true' or 'false'
      if (groupedVisibleValue === 'true') { // UNSELECT ALL
        newVisible = false;
      } else if (groupedVisibleValue === 'false') { // SELECT ALL
        newVisible = true;
      }
    } else if (arrGrouped.length && arrGrouped.length > 1) { // SELECT ALL - when there are different visible values
      newVisible = true;
    } else {
      return false;
    }

    // SELECT ALL or UNSELECT ALL
    this.ftItemsListGrouped = this.ftItemsListGrouped.map(item => {
      item.visible = newVisible;
      return item;
    });
  }

  getFieldListForFastTrack(selectField: SelectFieldEnum) {
    switch (selectField) {
      case this.selectFieldEnum.thickness:
        // all Fast Track thickness values
        let allFtThicknessValues = [];
        this.ftThicknessFieldList.map(item => {
          allFtThicknessValues = [...allFtThicknessValues, ...item.values];
          return item;
        });
        allFtThicknessValues = _.uniqWith(allFtThicknessValues, _.isEqual) // unique thickness

        // grouping all thickness by stage, stage will be unique
        let objGrouped = _.groupBy(_.cloneDeep(this.thicknessFieldList), item => item.stage);
        let arrGrouped: ThicknessFieldItem[] = _.map(objGrouped, (value, key) => {
          let dataList: any[] = [];
          let stage: number;

          // get stage and data list
          value.map(item => {
            dataList = [...dataList, ...item.values];
            stage = item.stage;
            return item;
          });

          // merge selected values from ftThickness
          let selectedValues = allFtThicknessValues
            .map(elValue => (dataList.find(dataItem => elValue.value === dataItem.value)) ? elValue : null)
            .filter(elValue => elValue);

          // sort the list
          selectedValues = _.uniqWith(selectedValues, _.isEqual); // unique
          selectedValues = _.orderBy(selectedValues, ['value'], ['asc']); // sort

          // sort the list
          dataList = _.uniqWith(dataList, _.isEqual); // unique
          dataList = _.orderBy(dataList, ['value'], ['asc']); // sort

          return ({
            stage: stage,
            values: selectedValues,
            dataList: dataList,
          });
        });
        arrGrouped = arrGrouped.filter(item => (item && item.stage && typeof item.stage === 'number'));

        // update Fast Track thickness
        this.ftThicknessFieldList = _.cloneDeep(arrGrouped);

        break;
      case this.selectFieldEnum.additionalFeatures:
        // all Fast Track additionalFeatures values
        let allFtAdditionalFeaturesValues = [];
        this.ftAdditionalFeaturesFieldList.map(item => {
          allFtAdditionalFeaturesValues = [...allFtAdditionalFeaturesValues, ...item.ids];
          return item;
        });
        allFtAdditionalFeaturesValues = _.uniqBy(allFtAdditionalFeaturesValues, 'id') // unique additionalFeatures

        // grouping all additionalFeatures by stage, stage will be unique
        let objAdditionalFeaturesGrouped = _.groupBy(_.cloneDeep(this.additionalFeaturesFieldList), item => item.stage);
        let arrAdditionalFeaturesGrouped: AdditionalFeaturesFieldItem[] = _.map(objAdditionalFeaturesGrouped, (value, key) => {
          let dataList: any[] = [];
          let stage: number;
          let mandatory: boolean = false;

          // get stage, mandatory and data list
          value.map(item => {
            dataList = [...dataList, ...item.ids];
            stage = item.stage;
            let foundItem = this.ftAdditionalFeaturesFieldList.find(elItem => elItem.stage === stage);
            mandatory = (foundItem) ? Boolean(foundItem.mandatory) : false;
            return item;
          });

          // merge selected values from ftAdditionalFeatures
          let selectedValues = allFtAdditionalFeaturesValues
            .map(elValue => (dataList.find(dataItem => elValue.id === dataItem.id)) ? elValue : null)
            .filter(elValue => elValue);

          // sort the list
          selectedValues = _.uniqBy(selectedValues, 'id'); // unique
          selectedValues = _.orderBy(selectedValues, ['title'], ['asc']); // sort

          // sort the list
          dataList = _.uniqBy(dataList, 'id'); // unique
          dataList = _.orderBy(dataList, ['title'], ['asc']); // sort

          return ({
            stage: stage,
            ids: selectedValues,
            mandatory: mandatory,
            dataList: dataList,
          });
        });
        arrAdditionalFeaturesGrouped = arrAdditionalFeaturesGrouped.filter(item => (item && item.stage && typeof item.stage === 'number'));

        // update Fast Track additionalFeatures
        this.ftAdditionalFeaturesFieldList = _.cloneDeep(arrAdditionalFeaturesGrouped);

        break;
    }
  }

  deselectFieldForFastTrack(selectField: SelectFieldEnum, currentValue: any, indexOfArray: number) {
    switch (selectField) {
      case this.selectFieldEnum.thickness:
        if (typeof indexOfArray === 'number' && this.thicknessFieldList[indexOfArray]) {
          let cannotDeselect: boolean = Boolean(this.ftThicknessFieldList.find(item => item.values.find(itemValue => (itemValue && itemValue.value) && (currentValue && currentValue.value) && (itemValue.value === currentValue.value))));

          // if selected value used in the Fast Track, we cannot delete this value
          if (cannotDeselect) {
            this.thicknessFieldList[indexOfArray].values.push(currentValue);
            this.thicknessFieldList = _.cloneDeep(this.thicknessFieldList);
            this.alertService.showError('You cannot remove this value, because it is used in Fast Track');
          }
        }

        this.setFieldStatus(this.selectFieldEnum.thickness);
        break;
      case this.selectFieldEnum.additionalFeatures:
        if (typeof indexOfArray === 'number' && this.additionalFeaturesFieldList[indexOfArray]) {
          let cannotDeselectAdditionalFeatures: boolean = Boolean(this.ftAdditionalFeaturesFieldList.find(item => item.ids.find(itemValue => (itemValue && itemValue.id) && (currentValue && currentValue.id) && (itemValue.id === currentValue.id))));

          // if selected value used in the Fast Track, we cannot delete this value
          if (cannotDeselectAdditionalFeatures) {
            this.additionalFeaturesFieldList[indexOfArray].ids.push(currentValue);
            this.additionalFeaturesFieldList = _.cloneDeep(this.additionalFeaturesFieldList);
            this.alertService.showError('You cannot remove this value, because it is used in Fast Track');
          }
        }

        this.setFieldStatus(this.selectFieldEnum.additionalFeatures);
        break;
    }
  }

  setFieldStatus(selectField: SelectFieldEnum) {
    switch (selectField) {
      case this.selectFieldEnum.thickness:
        let found = this.thicknessFieldList.find((item) => (item.values.length > 0)); // Valid data
        (found || this.stageSelectedItems[0]?.id === 4)
          ? this.applicationForm.controls['thickness'].clearValidators()
          : this.applicationForm.controls['thickness'].setValidators([Validators.required]);

        this.applicationForm.controls['thickness'].setValue(null);
        this.applicationForm.controls['thickness'].markAsTouched();
        this.applicationForm.controls['thickness'].updateValueAndValidity();

        // GET data lists
        this.getFieldListForFastTrack(this.selectFieldEnum.thickness);
        this.getAvailableCertificateThicknessList();

        break;
      case this.selectFieldEnum.width:
        // Might need to enforce it again --> Check for required
        // let foundWidth = this.widthFieldList.find((item) => (this.getTypeofNumber(item.min) && this.getTypeofNumber(item.max)) ); // Valid data
        // (foundWidth)
        //   ? this.applicationForm.controls['width'].clearValidators()
        //   : this.applicationForm.controls['width'].setValidators([Validators.required]);

        this.applicationForm.controls['width'].setValue(null);
        this.applicationForm.controls['width'].markAsTouched();
        this.applicationForm.controls['width'].updateValueAndValidity();
        break;
      case this.selectFieldEnum.height:
        // Might need to enforce it again --> Check for required
        // let foundHeight = this.heightFieldList.find((item) => (this.getTypeofNumber(item.min) && this.getTypeofNumber(item.max)) ); // Valid data
        // (foundHeight)
        //   ? this.applicationForm.controls['height'].clearValidators()
        //   : this.applicationForm.controls['height'].setValidators([Validators.required]);

        this.applicationForm.controls['height'].setValue(null);
        this.applicationForm.controls['height'].markAsTouched();
        this.applicationForm.controls['height'].updateValueAndValidity();
        break;
      case this.selectFieldEnum.additionalFeatures:
        this.applicationForm.controls['additional_features'].setValue(null);
        this.applicationForm.controls['additional_features'].markAsTouched();
        this.applicationForm.controls['additional_features'].updateValueAndValidity();

        // get data for FastTrack additionalFeatures
        this.getFieldListForFastTrack(this.selectFieldEnum.additionalFeatures);
        break;
    }
  }

  addField(selectField: SelectFieldEnum) {
    switch (selectField) {
      case this.selectFieldEnum.thickness:
        this.thicknessFieldList.push({
          values: [],
          stage: null
        });
        this.setFieldStatus(this.selectFieldEnum.thickness);
        break;
      case this.selectFieldEnum.width:
        this.widthFieldList.push({
          stage: null,
          min: null,
          max: null
        });
        this.setFieldStatus(this.selectFieldEnum.width);
        break;
      case this.selectFieldEnum.height:
        this.heightFieldList.push({
          stage: null,
          min: null,
          max: null
        });
        this.setFieldStatus(this.selectFieldEnum.height);
        break;
      case this.selectFieldEnum.additionalFeatures:
        this.additionalFeaturesFieldList.push({
          ids: [],
          stage: null,
          mandatory: false
        });
        this.setFieldStatus(this.selectFieldEnum.additionalFeatures);
        break;
      case this.selectFieldEnum.dimensions:
        this.ftDimensionsFieldList.push({
          size: this.ftDimensionsFieldList.length + 1,
          width: null,
          height: null,
          flap: null,
          gusset: null,
          dieline_url: ''
        });
        break;
    }
  }

  deleteField(selectField: SelectFieldEnum, itemField) {
    switch (selectField) {
      case this.selectFieldEnum.thickness:
        if (this.thicknessFieldList.length === 1) {
          return false;
        }

        let cannotDelete: boolean = Boolean(this.ftThicknessFieldList.find(item => item.values.find(itemValue => (itemValue && itemValue.value) && (itemField && itemField.values) && (itemField.values.find(el => el.value === itemValue.value)))));

        // if selected value used in the Fast Track, we cannot delete this field
        if (cannotDelete) {
          this.alertService.showError('You cannot remove this field, because it is used in Fast Track');
        } else {
          this.thicknessFieldList = this.thicknessFieldList.filter((item) => (item != itemField));
        }

        this.setFieldStatus(this.selectFieldEnum.thickness);
        break;
      case this.selectFieldEnum.width:
        if (this.widthFieldList.length === 1) {
          return false;
        }
        this.widthFieldList = this.widthFieldList.filter((item) => (item != itemField));
        this.setFieldStatus(this.selectFieldEnum.width);
        break;
      case this.selectFieldEnum.height:
        if (this.heightFieldList.length === 1) {
          return false;
        }
        this.heightFieldList = this.heightFieldList.filter((item) => (item != itemField));
        this.setFieldStatus(this.selectFieldEnum.height);
        break;
      case this.selectFieldEnum.additionalFeatures:
        if (this.additionalFeaturesFieldList.length === 1) {
          return false;
        }

        let cannotDeleteAdditionalFeatures: boolean = Boolean(this.ftAdditionalFeaturesFieldList.find(item => item.ids.find(itemValue => (itemValue && itemValue.id) && (itemField && itemField.ids) && (itemField.ids.find(el => el.id === itemValue.id)))));

        // if selected value used in the Fast Track, we cannot delete this field
        if (cannotDeleteAdditionalFeatures) {
          this.alertService.showError('You cannot remove this field, because it is used in Fast Track');
        } else {
          this.additionalFeaturesFieldList = this.additionalFeaturesFieldList.filter((item) => (item != itemField));
        }

        this.setFieldStatus(this.selectFieldEnum.additionalFeatures);
        break;
      case this.selectFieldEnum.dimensions:
        if (this.ftDimensionsFieldList.length === 1) {
          return false;
        }

        this.ftDimensionsFieldList = this.ftDimensionsFieldList
          .filter((item) => (item != itemField)) // delete field
          .map((item, index) => { // rewrite size
            item.size = index + 1;
            return item;
          });

        break;
    }
  }

  ngOnDestroy() {
    if (this.productsSubscription) {
      this.productsSubscription.unsubscribe();
    }

    if (this.categoriesSubscription) {
      this.categoriesSubscription.unsubscribe();
    }

    if (this.thicknessSubscription) {
      this.thicknessSubscription.unsubscribe();
    }
  }

  addProduct(draft: boolean) {
    const data = this.transformData(this.applicationForm.value);
    data.printing_method = JSON.parse(JSON.stringify(this.printingMethodAvailableFieldsList))
      .filter((item) => (item.values.length > 0))
      .map((item) => {
        item.values = item.values.map((obj) => obj.title);
        return item;
      });

    const partnerName: any[] = data.partner_name;
    data.partner_name = this.multiSelectService.transformSelectData(
      partnerName
    );

    const uploadData =  () => {
       this.uploadAllPhotosAndDocuments(data)
        .then((imagesData: ApplicationModel) => {
          imagesData.draft = draft;
          if (this.isCreateModal) {
            this.applicationService.addApplication(imagesData).subscribe(
              (newProduct: ApplicationModel) => {
                this.store.dispatch(
                  new ApplicationActions.AddApplication(newProduct)
                );
                this.closeModal();
                this.alertService.showSuccess('Successfully added!');
                let applicationTypeItem;
                if (this.applicationTypeList.length > 0) {
                  applicationTypeItem = this.applicationTypeList.find((item) => item.id === newProduct.type);
                }
                this.amplitudeService.addNewEvent(
                  this.formData ? 'Duplicate product' : 'Add new product',
                  {
                    productId: newProduct.id,
                    productTitle: (applicationTypeItem) ? applicationTypeItem.title : null,
                  }
                );
              },
              (err: HttpErrorResponse) => {
                this.alertService.showError(err.error.message);
              }
            );
          } else {
            this.applicationService
              .updateApplication(this.formData.id, imagesData)
              .subscribe(
                (updatedProduct: ApplicationModel) => {
                  this.store.dispatch(
                    new ApplicationActions.UpdateApplication({
                      applicationId: this.formData.id,
                      newApplication: updatedProduct,
                    })
                  );
                  this.closeModal();
                  this.alertService.showSuccess('Successfully updated!');
                  let applicationTypeItem;
                  if (this.applicationTypeList.length > 0) {
                    applicationTypeItem = this.applicationTypeList.find((item) => item.id === updatedProduct.type);
                  }
                  this.amplitudeService.addNewEvent('Edit product', {
                    productId: updatedProduct.id,
                    productTitle: (applicationTypeItem) ? applicationTypeItem.title : null,
                  });
                },
                (err: HttpErrorResponse) => {
                  this.alertService.showError(err.error.message);
                }
              );
          }
        })
        .catch((err) => {
          console.log(err);
        });
    }

    // before upload data, we should to check the appNumber if need
    let appNumber: string = (data && data.fast_track && data.fast_track.application_number) ? String(data.fast_track.application_number) : '';
    if (typeof appNumber === 'string' && appNumber.length === 0) {
      let isEqualFtItems: boolean = this.getIsEqualFtItems();
      if (isEqualFtItems) { // items must be the same
        uploadData();
      }
    } else {
      let appId: number = (this.formData && this.formData.id) ? this.formData.id : null;

      this.applicationService.checkApplicationNumberAvailable(appId, appNumber).subscribe(
        res => {
          let isEqualFtItems: boolean = this.getIsEqualFtItems();
          if (isEqualFtItems) { // items must be the same
            this.onInputFTApplicationNumber(null, true);
            uploadData();
          }
        }, err => {
          this.onInputFTApplicationNumber(null, false);
          this.alertService.showError('The Application Number, you typed has already been taken');
        });
    }
  }

  addFileEvent(images: PhotosResponse) {
    this.files = images.oldImages;
    this.newFiles = images.newImages;
  }

  uploadAvailableMarketingSamplePhoto() {
    const query = [
      {key: 'itemType', value: 'application'},
      {key: 'fileType', value: 'image'},
      {key: 'elementType', value: 'available_marketing_samples'},
    ];
    const copyAvailableMarketingSamplePhotos = this.availableMarketingSamplePhotos.map((item) => {
      return !item ? [] : item.newImages;
    });
    return Promise.all(
      copyAvailableMarketingSamplePhotos.map((photoObj) => {
        return this.fileService.uploadAllNewImages(photoObj, query);
      })
    );
  }

  uploadAllFtDimensionsFiles(list: FtDimensionsModel[]) {
    const pdfDimensionsQuery = [
      {key: 'itemType', value: 'application'},
      {key: 'fileType', value: 'document'},
      {key: 'elementType', value: 'dieline'},
    ];

    const files = list.map((item) => {
      if (!item.dieline_url || typeof item.dieline_url === 'string') {
        return [];
      } else {
        return [item.dieline_url];
      }
    });
    return Promise.all(
      files.map((file) => {
        return this.fileService.uploadAllNewImages(file, pdfDimensionsQuery);
      })
    );
  }

  getUploadedFtDimensionsData(ftDimensionsList: FtDimensionsModel[], uploadedFtDimensionsFiles: any[]): FtDimensionsModel[] {
    let copyFtDimensionsList: FtDimensionsModel[] = JSON.parse(JSON.stringify(ftDimensionsList)); // COPY

    copyFtDimensionsList = copyFtDimensionsList
      .map((ftDimItem, index) => {
        if (uploadedFtDimensionsFiles[index].length > 0) {
          ftDimItem.dieline_url = uploadedFtDimensionsFiles[index][0];
        } else {
          ftDimItem.dieline_url = (ftDimItem.dieline_url && typeof ftDimItem.dieline_url === 'string')
            ? ftDimItem.dieline_url.split('/').pop()
            : '';
        }

        return ftDimItem;
      })
      .filter(ftDimItem => ftDimItem.width && ftDimItem.height) // not empty
      .map((ftDimItem, ftDimItemIndex) => { // rewrite size value
        ftDimItem.size = ftDimItemIndex + 1;
        return ftDimItem;
      });

    return copyFtDimensionsList;
  }

  getUploadedFtItemsData(ftItemsListGrouped: FtItemsGroupedModel[], uploadedFtDimensionsData: FtDimensionsModel[]): FtItemsModel[] {
    let copyFtItemsListGrouped: FtItemsGroupedModel[] = _.cloneDeep(ftItemsListGrouped);
    let copyUploadedFtDimensionsData: FtDimensionsModel[] = _.cloneDeep(uploadedFtDimensionsData);
    let ftItemsList: FtItemsModel[] = [];
    copyFtItemsListGrouped.map(groupedItem => {
      groupedItem.fullItems.map(fullItem => {
        let objItem: FtItemsModel = {
          ...fullItem,
          visible: groupedItem.visible, // get from group
          moq: groupedItem.moq, // get from group
        };

        ftItemsList.push(objItem);
      });
    });

    // Important -> SET dieline_url, after uploaded dimensions
    ftItemsList = ftItemsList.map(ftItem => {
      let foundDimItem = copyUploadedFtDimensionsData.find(dimItem => dimItem.size === ftItem.dimension.size);
      ftItem.dimension.dieline_url = (foundDimItem && typeof foundDimItem.dieline_url === 'string') ? foundDimItem.dieline_url : '';
      return ftItem;
    });

    return _.cloneDeep(ftItemsList);
  }

  uploadAllStreams(streams: StreamModel[]) {
    const query = [
      {key: 'itemType', value: 'application'},
      {key: 'fileType', value: 'document'},
      {key: 'elementType', value: 'streams'},
    ];

    const files = streams.map((item) => {
      if (!item.file_url || typeof item.file_url === 'string') {
        return [];
      } else {
        return [item.file_url];
      }
    });
    return Promise.all(
      files.map((file) => {
        return this.fileService.uploadAllNewImages(file, query);
      })
    );
  }

  getUploadedStreamsData(streamList: StreamModel[], uploadedStreamFiles: any[]): StreamModel[] {
    let copyStreamList: StreamModel[] = JSON.parse(JSON.stringify(streamList)); // COPY
    copyStreamList = copyStreamList.map((stream, index) => {
      if (uploadedStreamFiles[index].length > 0) {
        stream.file_url = uploadedStreamFiles[index][0];
      } else {
        stream.file_url = (stream.file_url && typeof stream.file_url === 'string')
          ? stream.file_url.split('/').pop()
          : null;
      }

      return stream;
    });

    return copyStreamList;
  }

  uploadCustomerPhoto() {
    const query = [
      {key: 'itemType', value: 'application'},
      {key: 'fileType', value: 'image'},
      {key: 'elementType', value: 'customers'},
    ];
    const copyCustomerPhotos = this.customerPhotos.map((item) => {
      return !item ? [] : item.newImages;
    });
    return Promise.all(
      copyCustomerPhotos.map((photoObj) => {
        return this.fileService.uploadAllNewImages(photoObj, query);
      })
    );
  }

  uploadAllPhotosAndDocuments(data: ApplicationModel) {
    return new Promise((resolve, reject) => {
      const imageQuery = [
        {key: 'itemType', value: 'application'},
        {key: 'fileType', value: 'image'},
      ];
      const pdfQuery = [
        {key: 'itemType', value: 'application'},
        {key: 'fileType', value: 'document'},
        {key: 'elementType', value: 'dieline'},
      ];
      const pdfConsQuery = [
        {key: 'itemType', value: 'application'},
        {key: 'fileType', value: 'document'},
        {key: 'elementType', value: 'technical-considerations'},
      ];

      // upload main images
      this.fileService
        .uploadAllNewImages(this.newFiles, imageQuery)
        .then((images: string[]) => {
          data.images = this.fileService.filterImageArray(this.files);
          data.images.push(...images);

          this.fileService
            .uploadAllNewImages(
              this.checkBackendConsideration === true ||
              !this.getTechnicalConsiderationFile
                ? []
                : [this.getTechnicalConsiderationFile],
              pdfConsQuery
            )
            .then((considerationFile: string[]) => {
              data.technical_considerations =
                considerationFile.length > 0
                  ? {
                    url: considerationFile[0],
                    description: data.technical_considerations.description,
                  }
                  : this.checkBackendConsideration === true &&
                  this.getTechnicalConsiderationFile
                    ? {
                      url: this.getTechnicalConsiderationFile.split('/').pop(),
                      description: data.technical_considerations.description,
                    }
                    : {
                      url: null,
                      description: data.technical_considerations.description,
                    };

              this.fileService
                .uploadAllNewImages(
                  this.checkBackendDieline === true || !this.getDielineFile
                    ? []
                    : [this.getDielineFile],
                  pdfQuery
                )
                .then((dielineImages: string[]) => {
                  data.dieline =
                    dielineImages.length > 0
                      ? {url: dielineImages[0]}
                      : this.checkBackendDieline === true && this.getDielineFile
                        ? {url: this.getDielineFile.split('/').pop()}
                        : null;

                  // upload customers images
                  this.uploadCustomerPhoto()
                    .then((customersImages: any[]) => {
                      this.customersFiles.forEach((oldImages: any, index) => {
                        data.customers[
                          index
                          ].images = this.fileService.filterImageArray(
                          oldImages.images
                        );
                      });
                      customersImages.forEach((customerImage: any[], index) => {
                        if (customerImage && customerImage.length > 0) {
                          data.customers[index].images.push(...customerImage);
                        }
                      });

                      // upload available_marketing_samples images
                      this.uploadAvailableMarketingSamplePhoto()
                        .then((samplesImages: any[]) => {
                          this.availableMarketingSampleFiles.forEach((oldImages: any, index) => {
                            data.available_marketing_samples[
                              index
                              ].images = this.fileService.filterImageArray(
                              oldImages.images
                            );
                          });
                          samplesImages.forEach((sampleImages: any[], index) => {
                            if (sampleImages && sampleImages.length > 0) {
                              data.available_marketing_samples[index].images.push(...sampleImages);
                            }
                          });

                          // Upload streams files
                          this.uploadAllStreams(this.streamList)
                            .then((uploadedStreamFiles: any[]) => {
                              data.streams = this.getUploadedStreamsData(this.streamList, uploadedStreamFiles);

                              // Upload Fast Track dimensions files
                              this.uploadAllFtDimensionsFiles(this.ftDimensionsFieldList)
                                .then((uploadedFtDimensionsFiles: any[]) => {
                                  data.fast_track.dimensions = this.getUploadedFtDimensionsData(this.ftDimensionsFieldList, uploadedFtDimensionsFiles);
                                  // Important -> SET Fast Track Items, after uploaded dimensions
                                  data.fast_track.items = this.getUploadedFtItemsData(this.ftItemsListGrouped, data.fast_track.dimensions);

                                  resolve(data);
                                })
                                .catch((err) => {
                                  reject(err);
                                });
                            })
                            .catch((err) => {
                              reject(err);
                            });
                        })
                        .catch((err) => {
                          reject(err);
                        });
                    })
                    .catch((err) => {
                      reject(err);
                    });
                })
                .catch((err) => {
                  reject(err);
                });
            })
            .catch((err) => {
              reject(err);
            });
        })
        .catch((err) => {
          reject(err);
        });
    });
  }

  addAvailableMarketingSampleImageEvent(event: PhotosResponse, index) {
    this.availableMarketingSamplePhotos[index] = event;
    if (this.availableMarketingSampleFiles[index]) {
      this.availableMarketingSampleFiles[index].images = event.oldImages;
    }
  }

  addCustomerImageEvent(event: PhotosResponse, index) {
    this.customerPhotos[index] = event;
    if (this.customersFiles[index]) {
      this.customersFiles[index].images = event.oldImages;
    }
  }

  get getDielineFile() {
    return this.applicationForm.get('dieline').get('url').value;
  }

  get checkBackendDieline() {
    return (
      typeof this.applicationForm.get('dieline').get('url').value === 'string'
    );
  }

  get getTechnicalConsiderationFile() {
    return this.applicationForm.get('technical_considerations').get('url')
      .value;
  }

  get checkBackendConsideration() {
    return (
      typeof this.applicationForm.get('technical_considerations').get('url')
        .value === 'string'
    );
  }

  addDielineFile(files: FileList, controlName) {
    this.applicationForm.get(controlName).patchValue({url: files[0]});
  }

  deleteDielineFile(controlName) {
    this.applicationForm.get(controlName).get('url').reset();
  }

  preselectProductDropdown() {
    const productSelected = this.productList.find((item) =>
      this.formData.product.includes(item.id)
    );

    this.productFamilySelected = this.multiSelectService.preselectOptions(
      productSelected.family,
      this.categories
    );
    this.productFiltered = this.productList.filter((product) =>
      product.family.includes(productSelected.family[0])
    );

    this.productFilteredSelected = [productSelected];
  }

  preselectApplicationDropdown() {
    const applicationSelected = this.categories.find(
      (item) => item.id === this.formData.application[0]
    );

    if (applicationSelected) {
      const packagingSelected = this.categories.find(
        (item) => item.id === applicationSelected.parent_id
      );

      this.packagingListSelected = [packagingSelected];

      this.applicationList = this.multiSelectService.getDropdownByTitle(
        this.categories,
        packagingSelected.title
      );
      this.applicationSelected = [applicationSelected];
    }
  }

  preselectSegmentDropdown() {
    this.segmentSelected = this.formData.segment.map((item) =>
      this.categories.find((category) => category.id === item)
    );
    const copySegmentSelected = this.multiSelectService.transformSelectData(
      _.cloneDeep(this.segmentSelected)
    );

    this.segmentTypeList = this.multiSelectService.getDropdownByArray(
      this.categories,
      copySegmentSelected
    );

    this.segmentTypeSelected = this.formData.segment_type.map((id) =>
      this.categories.find((category) => category.id === id)
    );

    const copySegmentTypeSelected = this.multiSelectService.transformSelectData(
      _.cloneDeep(this.segmentTypeSelected)
    );

    this.packetGoodsList = this.multiSelectService.getDropdownByArray(
      this.categories,
      copySegmentTypeSelected
    );

    this.packetGoodsSelected = this.formData.packed_goods.map((id) =>
      this.categories.find((category) => category.id === id)
    );
  }

  toggleValidatorsLevelOfClearance() {
    let levelOfClearanceControl = this.applicationForm.get('level_of_clearance');
    if (!levelOfClearanceControl) {
      return false;
    }

    let stageId = this.applicationForm.get('stage').value;
    let found = this.stageList.find((item) => (item.id === stageId && item.id === this.stageItemIds.FUTURE_DEVELOPMENT));

    if (found) {
      this.levelOfClearanceIsVisible = true;
      levelOfClearanceControl.setValidators([Validators.required]);
    } else {
      this.levelOfClearanceIsVisible = false;
      levelOfClearanceControl.clearValidators();
    }

    levelOfClearanceControl.markAsTouched();
    levelOfClearanceControl.updateValueAndValidity();
  }

  toggleValidatorsTermsAndLimitations() {
    let stageId = this.applicationForm.get('stage').value;
    let found = this.stageList.find((item) => (item.id === stageId && item.id === this.stageItemIds.UNDER_DEVELOPMENT));

    if (found) {
      this.applicationForm.controls['terms_and_limitations'].setValidators([Validators.required]);
    } else {
      this.applicationForm.controls['terms_and_limitations'].clearValidators();
    }

    this.applicationForm.controls['terms_and_limitations'].markAsTouched();
    this.applicationForm.controls['terms_and_limitations'].updateValueAndValidity();
  }

  checkDropdownRequired(type: SelectNextEnum) {
    switch (type) {
      case SelectNextEnum.productFamilySelect:
        this.eventChangedProduct = true;
        this.productFilteredSelected.length > 0
          ? (this.productRequired = true)
          : (this.productRequired = false);

        // when changing the product
        this.getSelectedProductInfo();
        break;
      case SelectNextEnum.packagingSelect:
        this.eventChangedApplication = true;
        this.applicationSelected.length > 0
          ? (this.applicationRequired = true)
          : (this.applicationRequired = false);
        break;
      case SelectNextEnum.segmentSelect:
        this.eventChangedSegment = true;
        if (this.stageSelectedItems.length && this.stageSelectedItems[0].id !== 4) {
          this.segmentSelected.length > 0
            ? (this.segmentRequired = true)
            : (this.segmentRequired = false);
        }
        break;
      case SelectNextEnum.segmentTypeSelect:
        this.eventChangedSegmentType = true;
        this.segmentTypeSelected.length > 0
          ? (this.segmentTypeRequired = true)
          : (this.segmentTypeRequired = false);
        break;
    }
  }

  setNextDropdownValues(value: MultiSelectModel, type: SelectNextEnum) {
    if (this.stageSelectedItems.length && this.stageSelectedItems[0].id === 4) {
      this.segmentTypeRequired = true;
      this.segmentRequired = true;
      this.thicknessRequiredField = true;
      // this.applicationForm.controls['thickness'].clearValidators();
    }
    switch (type) {
      case SelectNextEnum.productFamilySelect:
        this.productFilteredSelected = [];
        this.productFiltered = value
          ? this.productList.filter((item) => item.family.includes(value.id))
          : [];
        break;
      case SelectNextEnum.packagingSelect:
        this.applicationSelected = [];
        this.applicationList = value
          ? this.multiSelectService.getDropdownByTitle(
            this.categories,
            value.title
          )
          : [];
        break;
      case SelectNextEnum.segmentSelect:
        const copySegmentSelected = this.multiSelectService.transformSelectData(
          _.cloneDeep(this.segmentSelected)
        );
        this.segmentTypeList = this.multiSelectService.getDropdownByArray(
          this.categories,
          copySegmentSelected
        );
        this.segmentTypeSelected = this.checkNextValues(
          this.segmentSelected,
          this.segmentTypeSelected
        );

        const copySegmentTypeSelectedSegment = this.multiSelectService.transformSelectData(
          _.cloneDeep(this.segmentTypeSelected)
        );
        this.packetGoodsList = this.multiSelectService.getDropdownByArray(
          this.categories,
          copySegmentTypeSelectedSegment
        );
        this.packetGoodsSelected = this.checkNextValues(
          this.segmentTypeSelected,
          this.packetGoodsSelected
        );
        break;
      case SelectNextEnum.segmentTypeSelect:
        const copySegmentTypeSelected = this.multiSelectService.transformSelectData(
          _.cloneDeep(this.segmentTypeSelected)
        );
        this.packetGoodsList = this.multiSelectService.getDropdownByArray(
          this.categories,
          copySegmentTypeSelected
        );
        this.packetGoodsSelected = this.checkNextValues(
          this.segmentTypeSelected,
          this.packetGoodsSelected
        );
        break;
      case SelectNextEnum.stageSelect:
        // Preselect available item from list
        this.stageSelectedItems = this.stageSelectedItems.filter(item => this.availableStageList.find(stageItem => item?.id === stageItem?.id));

        // Stage form control
        (this.stageSelectedItems.length > 0)
          ? this.applicationForm.controls['stage'].setValue(this.stageSelectedItems[0].id)
          : this.applicationForm.controls['stage'].setValue(null);

        this.applicationForm.controls['stage'].markAsTouched();
        this.applicationForm.controls['stage'].updateValueAndValidity();

        // Fields
        this.toggleValidatorsLevelOfClearance();
        this.toggleValidatorsTermsAndLimitations();
        break;
      case SelectNextEnum.applicationTypeSelect:
        (this.applicationTypeSelectedItems.length > 0)
          ? this.applicationForm.controls['type'].setValue(this.applicationTypeSelectedItems[0].id)
          : this.applicationForm.controls['type'].setValue(null);

        this.applicationForm.controls['type'].markAsTouched();
        this.applicationForm.controls['type'].updateValueAndValidity();
        break;
    }
  }

  checkNextValues(
    parentItems: MultiSelectModel[],
    nextItem: MultiSelectModel[]
  ) {
    if (nextItem.length > 0) {
      const parentItemsIds: number[] = _.map(parentItems, (value) => value.id);
      return _.filter(nextItem, (value: MultiSelectModel) => {
        const currentCategory = _.find(
          this.categories,
          (category) => category.id === value.id
        );
        return _.includes(parentItemsIds, currentCategory.parent_id);
      });
    } else {
      return [];
    }
  }

  addAvailableMarketingSample() {
    const ams = new FormGroup({
      images: new FormArray([]),
      description: new FormControl(''),
    });
    this.getAvailableMarketingSamples.push(ams);
  }

  deleteAvailableMarketingSample(index: number) {
    this.getAvailableMarketingSamples.removeAt(index);
    _.pullAt(this.availableMarketingSamplePhotos, index);
    _.pullAt(this.availableMarketingSampleFiles, index);
  }

  addCustomer() {
    const customer = new FormGroup({
      images: new FormArray([]),
      description: new FormControl(''),
    });
    this.getCustomers.push(customer);
  }

  deleteCustomer(index: number) {
    this.getCustomers.removeAt(index);
    _.pullAt(this.customerPhotos, index);
    _.pullAt(this.customersFiles, index);
  }

  get getCustomers() {
    return this.applicationForm.get('customers') as FormArray;
  }

  get getAvailableMarketingSamples() {
    return this.applicationForm.get('available_marketing_samples') as FormArray;
  }

  get getCertificatesArray(): FormArray {
    return (this.applicationForm) ? this.applicationForm?.get('certificates') as FormArray : null;
  }

  preselectCertificatesArray(certificates: CertificatesModel[]) {
    if (!Array.isArray(certificates) || !certificates?.length) {
      return false;
    }

    // Remove old items
    while (this.getCertificatesArray.length !== 0) {
      this.getCertificatesArray.removeAt(0);
    }

    certificates.map(item => {
      this.getCertificatesArray.push(this.getInitialCertificatesItem(item));
    });
  }

  getInitialCertificatesItem(certificate?: CertificatesModel): FormGroup {
    let certificateId: number = (typeof certificate?.certificate_id === 'number') ? certificate?.certificate_id : null;
    let certificateCategory: CategoryModel = (certificateId) ? this.categories.find(item => item?.id === certificateId) : null;
    let certifiedByCategory: CategoryModel = (certificateCategory) ? this.certifiedByList.find(item => item?.id === certificateCategory?.metadata?.certificate_certified_by) : null;

    let preselectCertifiedBy: CategoryModel[] = (certifiedByCategory) ? [certifiedByCategory] : [];
    let preselectCertificateValueList: CategoryModel[] = (certificateCategory) ? [certificateCategory] : [];
    let preselectDownloadGraphics: boolean = (certificate?.download_graphics) ? certificate?.download_graphics : false;
    let preselectNotes: string = (typeof certificate?.notes === 'string') ? certificate?.notes : '';
    let preselectThickness: (number | string)[] = (Array.isArray(certificate?.thickness)) ? certificate?.thickness : [];

    // IMPORTANT cloneDeep for new instance of object
    return _.cloneDeep(
      new FormGroup({
        certified_by: new FormControl(preselectCertifiedBy),
        certificate: new FormGroup({
          data_list: new FormControl([]),
          value_list: new FormControl(preselectCertificateValueList),
        }),
        download_graphics: new FormControl(preselectDownloadGraphics),
        notes: new FormControl(preselectNotes),
        thickness: new FormControl(preselectThickness),
      })
    );
  }

  addCertificatesItem() {
    this.getCertificatesArray.push(this.getInitialCertificatesItem());
  }

  removeCertificatesItem(index: number) {
    this.getCertificatesArray.removeAt(index);
  }

  getCertifiedByList() {
    const CERTIFIED_BY = AppConstants.MainCategoryNames.CERTIFIED_BY;
    let certifiedByListParent: CategoryModel = (this.categories)
      ? this.categories.find((category) => (category.title === CERTIFIED_BY.title && category.level === CERTIFIED_BY.level))
      : null;

    // GET certifiedByList
    this.certifiedByList = (certifiedByListParent)
      ? this.multiSelectService.getDropdownById(this.categories, certifiedByListParent.id)
      : [];
  }

  getAvailableApplicationCertificatesList() {
    const CERTIFICATES = AppConstants.MainCategoryNames.CERTIFICATES;
    let certificatesParent: CategoryModel = (this.categories)
      ? this.categories.find((category) => (category.title === CERTIFICATES.title && category.level === CERTIFICATES.level))
      : null;

    let allCertificatesList: CategoryModel[] = (certificatesParent)
      ? this.multiSelectService.getDropdownById(this.categories, certificatesParent.id)
      : [];

    this.availableApplicationCertificatesList = allCertificatesList.filter(categoryItem => {
      let certificateAvailableForIds = AppConstants.CertificateAvailableForIds;
      let isAvailable: boolean = (Array.isArray(categoryItem?.metadata?.certificate_available_for))
        ? Boolean(categoryItem?.metadata?.certificate_available_for.find(id => id === certificateAvailableForIds.APPLICATIONS))
        : false;

      return isAvailable;
    });
  }

  getAvailableCertificateThicknessList() {
    let list: number[] = [];
    _.cloneDeep(this.thicknessFieldList).map(item => {
      if (Array.isArray(item?.values)) {
        list.push(...item?.values?.map(obj => obj?.value));
      }
      return item;
    });
    list = list.filter(item => item); // without empty items
    list = _.uniqWith(list, _.isEqual) // unique items
    list = _.sortBy(list); // sort items

    // Available thickness
    let nameAllThickness: string = AppConstants.CertificateThicknessNames.ALL_THICKNESS;
    this.availableCertificateThicknessList = (Array.isArray(list)) ? [nameAllThickness, ...list] : [nameAllThickness];

    // Check and preselect thickness
    this.getCertificatesArray.controls.map(itemControl => {
      let thicknessControl = itemControl?.get('thickness');
      let thicknessValue: (number | string)[] = (thicknessControl && Array.isArray(thicknessControl?.value))
        ? thicknessControl?.value || []
        : [];

      if (thicknessControl) {
        let preselectThicknessValue: (number | string)[] = thicknessValue.filter(item => this.availableCertificateThicknessList.find(item2 => item === item2));
        thicknessControl.setValue(preselectThicknessValue, {emitEvent: false});
      }

      return itemControl;
    });
  }

  getTransformedCertificates(certificates: any[]): CertificatesModel[] {
    let transformedCertificates: CertificatesModel[] = (Array.isArray(certificates) && certificates.length)
      ? certificates.map(item => {
        let certificateIdValue: number = (Array.isArray(item?.certificate?.value_list) && item?.certificate?.value_list?.length) ? item?.certificate?.value_list[0].id : null; // [0] because, single select
        let downloadGraphicsValue: boolean = (typeof item?.download_graphics === 'boolean') ? item?.download_graphics : false;
        let notesValue: string = (item?.notes && typeof item?.notes === 'string') ? item?.notes : '';
        let thicknessValue: (number | string)[] = (Array.isArray(item?.thickness)) ? item?.thickness : [];

        return {
          certificate_id: certificateIdValue,
          download_graphics: downloadGraphicsValue,
          notes: notesValue,
          thickness: thicknessValue,
        };
      }).filter(item => item?.certificate_id)
      : [];

    return transformedCertificates;
  }

  private transformData(formData: ApplicationModel) {
    const data = _.cloneDeep(formData);

    // level_of_clearance
    let selectedLevelOfClearance: LevelOfClearanceModel[] = this.applicationForm.get('level_of_clearance').value;
    let selectedLevelOfClearanceValue: number = (Array.isArray(selectedLevelOfClearance) && selectedLevelOfClearance.length) ? selectedLevelOfClearance[0].id : null;
    data.level_of_clearance = (this.levelOfClearanceIsVisible) ? selectedLevelOfClearanceValue : null;

    // display_priority
    let selectedDisplayPriority = this.applicationForm.get('display_priority').value;
    data.display_priority = (selectedDisplayPriority && selectedDisplayPriority.length) ? selectedDisplayPriority[0] : 5; // 5 as default

    data.product = this.multiSelectService.transformSelectData(
      this.productFilteredSelected
    );
    data.application = this.multiSelectService.transformSelectData(
      this.applicationSelected
    );
    data.segment = this.multiSelectService.transformSelectData(
      this.segmentSelected
    );
    data.segment_type = this.multiSelectService.transformSelectData(
      this.segmentTypeSelected
    );
    data.packed_goods = this.multiSelectService.transformSelectData(
      this.packetGoodsSelected
    );
    data.thickness = JSON.parse(JSON.stringify(this.thicknessFieldList))
      .filter((item) => (item.values.length > 0))
      .map((item) => {
        item.values = item.values.map((obj) => obj.value);
        return item;
      });
    data.width = JSON.parse(JSON.stringify(this.widthFieldList))
      .filter((item) => (this.getTypeofNumber(item.min) && this.getTypeofNumber(item.max)));
    data.height = JSON.parse(JSON.stringify(this.heightFieldList))
      .filter((item) => (this.getTypeofNumber(item.min) && this.getTypeofNumber(item.max)));
    data.additional_features = JSON.parse(JSON.stringify(this.additionalFeaturesFieldList))
      .filter((item) => (item.ids.length > 0))
      .map((item) => {
        item.ids = item.ids.map((obj) => obj.id);
        return item;
      });

    data.certifications = this.getSelectedCertificates();
    data.certificates = this.getTransformedCertificates(data?.certificates);

    // Fast Track section
    data.fast_track.thickness = JSON.parse(JSON.stringify(this.ftThicknessFieldList))
      .filter((item) => (item.values.length > 0))
      .map((item) => {
        item.values = item.values.map((obj) => obj.value);
        (item.dataList) ? delete item.dataList : null; // delete prop - dataList
        return item;
      });
    data.fast_track.additional_features = JSON.parse(JSON.stringify(this.ftAdditionalFeaturesFieldList))
      .filter((item) => (item.ids.length > 0))
      .map((item) => {
        item.ids = item.ids.map((obj) => obj.id);
        (item.dataList) ? delete item.dataList : null; // delete prop - dataList
        return item;
      });
    data.fast_track.number_of_printing_colors = _.sortBy(data.fast_track.number_of_printing_colors);
    data.fast_track.dimensions = []; // set data after upload files
    data.fast_track.items = []; // set data after upload dimensions

    return data;
  }

  onInputFTApplicationNumber(event, hasResultAppNumber?: boolean) {
    let ftApplicationNumberControl = this.applicationForm.get('fast_track').get('application_number');
    if (!ftApplicationNumberControl) {
      return false;
    }

    const initalValue = String(ftApplicationNumberControl.value);
    let reg = /[^0-9]*/g;
    let replaceValue: string = initalValue.replace(reg, '');
    let correctValue: string = replaceValue.length > 2 ? replaceValue.substring(0, 2) : replaceValue;
    ftApplicationNumberControl.setValue(correctValue);

    if (event && initalValue !== correctValue) {
      event.stopPropagation();
    }

    // check AppNumber
    if (correctValue.length === 0) {
      ftApplicationNumberControl.setErrors(null);
    } else if (correctValue.length === 1 || correctValue === '00') {
      ftApplicationNumberControl.setErrors({notFull: true});
    } else if (correctValue.length === 2) {
      if (typeof hasResultAppNumber === 'boolean') { // when we have result and do not need request
        if (hasResultAppNumber === true) { // AppNumber is available
          ftApplicationNumberControl.setErrors(null);
        } else { // AppNumber is not available
          ftApplicationNumberControl.setErrors({notAvailable: true});
        }
      } else { // default
        let appId: number = (this.formData && this.formData.id) ? this.formData.id : null;
        this.applicationService.checkApplicationNumberAvailable(appId, correctValue).subscribe(
          res => {
            ftApplicationNumberControl.setErrors(null); // AppNumber is available
          }, err => {
            ftApplicationNumberControl.setErrors({notAvailable: true}); // AppNumber is not available
          });
      }
    }
  }

  dragDropFtDimensions(event: CdkDragDrop<string[]>) {
    if (event && event.previousContainer === event.container) {
      moveItemInArray(this.ftDimensionsFieldList, event.previousIndex, event.currentIndex);
      this.ftDimensionsFieldList = this.ftDimensionsFieldList.map((item, index) => { // rewrite size
        item.size = index + 1;
        return item;
      });
    }
  }

  selectTab(currentTab: TabDirective, fastTrackTab?: boolean) {
    // Fast Track Tab
    if (fastTrackTab) {
      let typeValid: boolean = (Array.isArray(this.applicationTypeSelectedItems) && this.applicationTypeSelectedItems.length) ? true : false;
      let thicknessValid: boolean = !!this.thicknessFieldList.find(item => (item && item.values && item.values.length));
      let productValid: boolean = (Array.isArray(this.productFilteredSelected) && this.productFilteredSelected.length) ? true : false;
      let segmentValid: boolean = (Array.isArray(this.segmentSelected) && this.segmentSelected.length) ? true : false;
      let segmentTypeValid: boolean = (Array.isArray(this.segmentTypeSelected) && this.segmentTypeSelected.length) ? true : false;

      if ((!typeValid || !thicknessValid || !productValid || !segmentValid || !segmentTypeValid) && this.stageSelectedItems[0]?.id !== 4) {
        setTimeout(() => { // without setTimeout, it doesn't work
          this.staticTabs.tabs[0].active = true; // go to first tab as default
          this.alertService.showError("You can't add a Fast Track application before filling the relevant fields in the custom tab");
        }, 0);
      }
    }
  }

  addPrintingMethod() {
    this.printingMethodAvailableFieldsList.push({
      values: [],
      stage: null
    });
  }

  deletePrintingField(itemField) {
    if (this.printingMethodAvailableFieldsList.length === 1) {
      return false;
    }

    this.printingMethodAvailableFieldsList = this.printingMethodAvailableFieldsList.filter((item) => (item != itemField));
  }

  closeModal() {
    this.bsModalRef.hide();
  }
}
