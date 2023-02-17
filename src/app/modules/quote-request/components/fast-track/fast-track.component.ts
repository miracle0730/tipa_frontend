import { Component, OnInit, OnDestroy, ElementRef, Input, OnChanges, SimpleChanges, } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { ActivatedRoute, Router } from '@angular/router';
import { FormGroup, FormBuilder, FormControl, Validators, FormControlName, FormArray, AbstractControl,} from '@angular/forms';

// Services
import { QuoteRequestService, AlertService, MultiSelectService, ApplicationService, ProductService, CategoryService, } from '@services';

// Interfaces
import { CategoryModel, CertificateModel, ApplicationModel, RfqModel, RfqFormModel, ProductModel, RfqFormModelAdditionalFeaturesSection, ManufacturingTechniqueModel, FilmGradeModel, OpportunitySection, RfqFormModelAdditionalFeature, FeedbackSectionItem, PricingSectionItems, CofModel, StageItem, RfqFormModeModel, RfqShortItemModel, GraphicsSectionExternalLogo, RfqModelAdditionalFeaturesSection, AdditionalFeaturesModel, MultiSelectModel, FtItemsModel, GetApplicationsParamsModel, GetProductsParamsModel, } from '@models';

// Constants
import { AppConstants } from '@core/app.constants';

// Libs
import { IDropdownSettings } from 'ng-multiselect-dropdown';
import { forkJoin, Observable, Subscription } from 'rxjs';
import { map, distinctUntilChanged, } from 'rxjs/operators';
import * as _ from 'lodash';

interface ThicknessItemModel {
  id: string;
  title: number;
}

interface DimensionItemModel {
  id: string;
  title: string;
  size: number;
  width: number;
  height: number;
  flap: number;
  gusset: number;
}

export interface PricingMeasureUnit {
  id: number;
  title: string;
}

const RFQ = {
  packaging: 'Packaging',
  reel: 'Reel',
  nameNA: 'N/A',
  applicationNames: {
    reelFilm: 'Reel – Film',
    bagFilm: 'Bag – Film',
    reelLaminate: 'Reel – Laminate',
    pouchLaminate: 'Pouch – Laminate',
    garmentBag: 'Garment bag',
  },
  additionalFeatures: {
    flap: {
      title: 'Flap'
    },
    gusset: {
      title: 'Gusset'
    },
  },
  pricingMeasureUnitNames: {
    units: 'Units',
    imp: 'Imp',
    kg: 'Kg',
    meter: 'Meter'
  }
};

@Component({
  selector: 'app-fast-track',
  templateUrl: './fast-track.component.html',
  styleUrls: ['./fast-track.component.scss']
})
export class FastTrackComponent implements OnInit, OnDestroy, OnChanges {
  @Input() opportunitySection: OpportunitySection;
  @Input() opportunityId: number;

  public categoriesSubscription: Subscription;
  public applicationsSubscription: Subscription;
  public productsSubscription: Subscription;
  public multiSubscription: Subscription;

  // General
  public RFQ = RFQ;
  public rfqForm: FormGroup;
  public ftItemInfo: FtItemsModel;
  public calculatedPriceListFtItemInfo: FtItemsModel;
  public categories: CategoryModel[] = [];
  public applications: ApplicationModel[] = [];
  public products: ProductModel[] = [];

  // Segment
  public segmentList: CategoryModel[] = [];
  public segmentTypeList: CategoryModel[] = [];
  public segmentTypeIsOther: boolean = false;
  public packetGoodsList: CategoryModel[] = [];
  public packedGoodsIsOther: boolean = false;

  // Application
  public applicationInfo: ApplicationModel;
  public applicationList: CategoryModel[] = [];
  public applicationProductList: MultiSelectModel[] = [];
  public ftCodeList: string[] = [];
  public searchByFtCode: boolean = true;
  public searchBy = {
    ftCode: 'ftCode',
    application: 'application',
  };

  // Product
  public thicknessList: ThicknessItemModel[] = [];

  // Dimension
  public dimensionList: DimensionItemModel[] = [];

  // Graphics
  public numberOfColorsList: number[] = [];

  // Pricing
  public allPricingMeasureUnitList: PricingMeasureUnit[] = [
    {
      id: 1,
      title: RFQ.pricingMeasureUnitNames.units
    },
    {
      id: 2,
      title: RFQ.pricingMeasureUnitNames.imp
    },
    {
      id: 3,
      title: RFQ.pricingMeasureUnitNames.kg
    },
    {
      id: 4,
      title: RFQ.pricingMeasureUnitNames.meter
    },
  ];
  public pricingMeasureUnitList: PricingMeasureUnit[] = JSON.parse(JSON.stringify(this.allPricingMeasureUnitList));
  public shippingTermsList: string[] = this.quoteRequestService.getShippingTermsList();

  public otherCategory: CategoryModel = {
    id: -1,
    parent_id: null,
    level: null,
    title: 'other',
    createdAt: null,
    updatedAt: null,
    metadata: {}
  };

  constructor(
    // private route: ActivatedRoute,
    // private router: Router,
    private formBuilder: FormBuilder,
    private elementRef: ElementRef,
    private quoteRequestService: QuoteRequestService,
    private multiSelectService: MultiSelectService,
    private alertService: AlertService,
    private applicationService: ApplicationService,
    private productService: ProductService,
    private categoryService: CategoryService,
  ) {
    this.rfqForm = this.formBuilder.group({
      // Segment's fields
      segment_section: new FormGroup({
        segment: new FormControl([], [Validators.required]),
        segment_type: new FormControl([], [Validators.required]),
        other_segment_type: new FormControl(''),
        packed_goods: new FormControl([], [Validators.required]),
        other_packed_goods: new FormControl(''),
        expected_shelf_life: new FormControl(''),  
      }),
      // Application's fields
      application_section: new FormGroup({
        search_by: new FormControl((this.searchByFtCode) ? this.searchBy.ftCode : this.searchBy.application, [Validators.required]),
        search_by_ft_code: new FormControl([]),
        packaging: new FormControl([]),
        application: new FormControl([], [Validators.required]),
        application_product: new FormControl([], [Validators.required]),
        application_type: new FormControl([]),
        other_application_type: new FormControl(''),
        // estimated_application_type: new FormControl([]),
        // other_estimated_application_type: new FormControl(''),
      }),
      // Product's fields
      product_section: new FormGroup({
        product_family: new FormControl([]),
        product: new FormControl([]),
        film_grade: new FormControl([]),
        thickness: new FormControl([], [Validators.required]),
        manufacturing_technique: new FormControl(''),
      }),
      // AdditionalFeatures's fields
      additional_features_section: new FormArray([]),
      // Dimensions's fields
      dimensions_section: new FormGroup({
        dimension: new FormControl([], [Validators.required]),
        width: new FormControl(null),
        height: new FormControl(null),
        flap: new FormControl(null),
        closed_gusset: new FormControl(null),
        // core: new FormControl([]),
        // reel_length_limitation: new FormControl(''),
        // box_weight_limitation: new FormControl(''),
        // od: new FormControl(RFQ.nameNA),
        // reel_weight_limitation: new FormControl(''),
        // cof: new FormControl([]),
      }),
      // Graphics's fields
      graphics_section: new FormGroup({
        printing: new FormControl(true),
        digital_printing: new FormControl(false),
        number_of_colors: new FormControl([], [Validators.required]),
        // rtf: new FormControl(''),
        // external_logo: new FormArray([]),
      }),
      // Pricing's fields
      pricing_section: new FormGroup({
      //   currency: new FormControl((this.priceCurrencyList.length) ? this.priceCurrencyList[0] : ''),
        shipping_terms: new FormControl((this.shippingTermsList.length) ? [this.shippingTermsList[0]] : []), // ['EXW'] by default
        pricing_measure_unit: new FormControl(this.getInitialPricingMeasureUnitValue()),
      //   imp_width: new FormControl(null),
      //   imp_height: new FormControl(null),
        moq: new FormControl(null),
      //   annual_quantity_potential: new FormControl(''),
      //   current_material_used: new FormControl(''),
      //   current_price_payed: new FormControl(null),
      //   items: new FormArray([
      //     new FormGroup({
      //       quantity: new FormControl(null, [Validators.required]),
      //       price_per_unit: new FormControl(''),
      //       price_total: new FormControl(''),
      //       eur_cost: new FormControl(null),
      //       usd_cost: new FormControl(null),
      //       convertor_cost_eur: new FormControl(null),
      //       convertor_cost_usd: new FormControl(null),
      //     }),
      //   ]),
      fast_track_code: new FormControl(''),
      price_list: new FormArray([], [Validators.required]),
      //   remarks: new FormControl(''),
      }),
      // Other's fields
      other_section: new FormGroup({
        rfq_is_for: new FormControl(''),
      }),
    });
  }

  ngOnInit(): void {
    this.multiSubscription = forkJoin([this.getCategories(), this.getApplications(), this.getProducts()]).subscribe((res) => {
      // Initial data
      this.getSegmentList();
      this.getApplicationList();
    }, (err) => {
      this.alertService.showError('');
    });

    this.getSegmentSection.get('segment').valueChanges
      .pipe(distinctUntilChanged((x, y) => JSON.stringify(x) === JSON.stringify(y)))
      .subscribe(() => {
        this.preselectSegmentList();
        this.getSegmentTypeList();
      });

    this.getSegmentSection.get('segment_type').valueChanges
      .pipe(distinctUntilChanged((x, y) => JSON.stringify(x) === JSON.stringify(y)))
      .subscribe((value: CategoryModel[]) => {        
        // Show/Hide other_segment_type field
        this.segmentTypeIsOther = (this.getValueIsOtherCategory(this.getValueSingleSelect(value))) ? true : false;

        this.preselectSegmentTypeList();
        this.getPackedGoodsList();
      });

    this.getSegmentSection.get('packed_goods').valueChanges
      .pipe(distinctUntilChanged((x, y) => JSON.stringify(x) === JSON.stringify(y)))
      .subscribe((value: CategoryModel[]) => {
        // Show/Hide other_packed_goods field
        this.packedGoodsIsOther = (this.getValueIsOtherCategory(this.getValueSingleSelect(value))) ? true : false;

        this.preselectPackedGoodsList();
      });

    this.getApplicationSection.get('search_by').valueChanges
      .pipe(distinctUntilChanged((x, y) => JSON.stringify(x) === JSON.stringify(y)))
      .subscribe(() => {
        this.getSearchBy();
      });

    this.getApplicationSection.get('search_by_ft_code').valueChanges
      .pipe(distinctUntilChanged((x, y) => JSON.stringify(x) === JSON.stringify(y)))
      .subscribe(() => {
        this.preselectFtCodeList();
        this.preselectFieldsByFtCode();
      });

    this.getApplicationSection.get('application').valueChanges
      .pipe(distinctUntilChanged((x, y) => JSON.stringify(x) === JSON.stringify(y)))
      .subscribe(() => {
        this.preselectApplicationList();
        this.getApplicationProductList();
        this.getFtItemInfo(); // GET the final Application Fast Track Item
      });

    this.getApplicationSection.get('application_product').valueChanges
      .pipe(distinctUntilChanged((x, y) => JSON.stringify(x) === JSON.stringify(y)))
      .subscribe(() => {
        this.preselectApplicationProductList();
        this.getApplicationInfo(); // IMPORTANT, when we have Application Info, we can get the next other data lists
        this.getThicknessList();
        this.getFtItemInfo(); // GET the final Application Fast Track Item
      });

    this.getProductSection.get('thickness').valueChanges
      .pipe(distinctUntilChanged((x, y) => JSON.stringify(x) === JSON.stringify(y)))
      .subscribe(() => {
        this.preselectThicknessList();
        this.getDimensionList();
        this.getFtItemInfo(); // GET the final Application Fast Track Item
      });

    this.getDimensionsSection.get('dimension').valueChanges
      .pipe(distinctUntilChanged((x, y) => JSON.stringify(x) === JSON.stringify(y)))
      .subscribe(() => {
        this.preselectDimensionList();
        this.preselectFieldsByDimension();
        this.getNumberOfColorsList();
        this.getFtItemInfo(); // GET the final Application Fast Track Item
      });

    this.getGraphicsSection.get('number_of_colors').valueChanges
      .pipe(distinctUntilChanged((x, y) => JSON.stringify(x) === JSON.stringify(y)))
      .subscribe(() => {
        this.preselectNumberOfColorsList();
        this.getFtItemInfo(); // GET the final Application Fast Track Item
      });

    this.getAdditionalFeaturesSection.valueChanges
      .pipe(distinctUntilChanged((x, y) => JSON.stringify(x) === JSON.stringify(y)))
      .subscribe(() => {
        this.validatorsAdditionalFeaturesList();
      });

    this.getPricingSectionPriceList.valueChanges
      .pipe(distinctUntilChanged((x, y) => JSON.stringify(x) === JSON.stringify(y)))
      .subscribe(() => {
        this.validatorsFtRfqPriceList();
      });
  }

  ngOnDestroy() {
    if (this.categoriesSubscription) {
      this.categoriesSubscription.unsubscribe();
    }
    if (this.applicationsSubscription) {
      this.applicationsSubscription.unsubscribe();
    }
    if (this.productsSubscription) {
      this.productsSubscription.unsubscribe();
    }
    if (this.multiSubscription) {
      this.multiSubscription.unsubscribe();
    }
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes) {
      for (const [key, value] of Object.entries(changes)) {
        this[key] = value.currentValue;
      }
    }
  }

  get getSegmentSection(): FormGroup {
    return this.rfqForm.get('segment_section') as FormGroup;
  }

  get getApplicationSection(): FormGroup {
    return this.rfqForm.get('application_section') as FormGroup;
  }

  get getProductSection(): FormGroup {
    return this.rfqForm.get('product_section') as FormGroup;
  }

  get getAdditionalFeaturesSection(): FormArray {
    return this.rfqForm.get('additional_features_section') as FormArray;
  }
  
  getAdditionalFeatureListArray(control: AbstractControl): FormArray {
    return control.get('list') as FormArray;
  }

  getAdditionalFeatureHintsArray(control: AbstractControl): FormArray {
    return control.get('additional_feature_hints') as FormArray;
  }

  get getDimensionsSection(): FormGroup {
    return this.rfqForm.get('dimensions_section') as FormGroup;
  }

  get getGraphicsSection(): FormGroup {
    return this.rfqForm.get('graphics_section') as FormGroup;
  }

  get getPricingSection(): FormGroup {
    return this.rfqForm.get('pricing_section') as FormGroup;
  }

  get getPricingSectionPriceList(): FormArray {
    return this.getPricingSection.get('price_list') as FormArray;
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

  getApplications() {
    return new Observable((observer) => {
      // GET applications without associated applications
      let dataParams: GetApplicationsParamsModel = {
        rfq_page: true,
      };

      this.applicationsSubscription = this.applicationService.getApplications(dataParams).subscribe(
        (res) => {
          this.applications = res;

          // GET lists
          this.getFtCodeList();

          // observer complete
          observer.next(this.applications);
          observer.complete();
        },
        (err: HttpErrorResponse) => {
          this.alertService.showError(err.error.message);
          // observer complete
          observer.error(err);
        }
      );
    });
  }

  getProducts() {
    return new Observable((observer) => {
      let dataParams: GetProductsParamsModel = {
        rfq_page: true,
      };

      this.productsSubscription = this.productService.getProducts(dataParams)
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

  getSegmentList() {
    const SEGMENTS = AppConstants.MainCategoryNames.SEGMENTS;
    let segmentListParent = this.categories
      .find((category) => (category.title === SEGMENTS.title && category.level === SEGMENTS.level) );
    
    // GET segmentList
    this.segmentList = [];
    if (segmentListParent) {
      this.segmentList = this.multiSelectService.getDropdownById(this.categories, segmentListParent.id);
    }

    // PRESELECT segmentList
    this.preselectSegmentList();
  }

  preselectSegmentList() {
    let segmentControl = this.getSegmentSection.get('segment');
    let segmentValue: CategoryModel[]  = (segmentControl) ? _.cloneDeep(segmentControl.value) : [];
    
    let preselectSegmentValue: CategoryModel[] = segmentValue
      .filter(item => (this.segmentList.find(categoryItem => item.id === categoryItem.id)) ? item : null);
    
    if (segmentControl) {
      segmentControl.setValue(preselectSegmentValue, {emitEvent: false});
      segmentControl.markAsPristine();
    }
  }

  getSegmentTypeList() {
    let segmentControl = this.getSegmentSection.get('segment');
    let segmentValue: CategoryModel[]  = (segmentControl) ? _.cloneDeep(segmentControl.value) : [];
    
    // GET segmentTypeList
    this.segmentTypeList = [];
    if (segmentValue && segmentValue.length) {
      const segmentValueIds: number[] = _.cloneDeep(segmentValue)
        .map(item => item.id)
        .filter(id => (id && typeof id === 'number' && id > 0)); // IMPORTANT id > 0, because, custom ('other') categories have incorrect id
      this.segmentTypeList = this.multiSelectService.getDropdownByArray(this.categories, segmentValueIds);
      this.segmentTypeList.push(this.otherCategory);
    }

    // PRESELECT segmentTypeList
    this.preselectSegmentTypeList();
  }

  preselectSegmentTypeList() {
    let segmentTypeControl = this.getSegmentSection.get('segment_type');
    let segmentTypeValue: CategoryModel[]  = (segmentTypeControl) ? _.cloneDeep(segmentTypeControl.value) : [];
    
    let preselectSegmentTypeValue: CategoryModel[] = segmentTypeValue
      .filter(item => (this.segmentTypeList.find(categoryItem => item.id === categoryItem.id)) ? item : null);
    
    if (segmentTypeControl) {
      segmentTypeControl.setValue(preselectSegmentTypeValue, {emitEvent: false});
      segmentTypeControl.markAsPristine();
    }
  }

  getPackedGoodsList() {
    let segmentTypeControl = this.getSegmentSection.get('segment_type');
    let segmentTypeValue: CategoryModel[]  = (segmentTypeControl) ? _.cloneDeep(segmentTypeControl.value) : [];

    // GET packetGoodsList
    this.packetGoodsList = [];
    if (segmentTypeValue && segmentTypeValue.length) {
      const segmentTypeValueIds: number[] = _.cloneDeep(segmentTypeValue)
        .map(item => item.id)
        .filter(id => (id && typeof id === 'number' && id > 0)); // IMPORTANT id > 0, because, custom ('other') categories have incorrect id
      this.packetGoodsList = this.multiSelectService.getDropdownByArray(this.categories, segmentTypeValueIds);
      this.packetGoodsList.push(this.otherCategory);
    }

    // PRESELECT packetGoodsList
    this.preselectPackedGoodsList();
  }

  preselectPackedGoodsList() {
    let packedGoodsControl = this.getSegmentSection.get('packed_goods');
    let packedGoodsValue: CategoryModel[]  = (packedGoodsControl) ? _.cloneDeep(packedGoodsControl.value) : [];
    
    let preselectPackedGoodsValue: CategoryModel[] = packedGoodsValue
      .filter(item => (this.packetGoodsList.find(categoryItem => item.id === categoryItem.id)) ? item : null);
    
    if (packedGoodsControl) {
      packedGoodsControl.setValue(preselectPackedGoodsValue, {emitEvent: false});
      packedGoodsControl.markAsPristine();
    }
  }

  getSearchBy() {
    let searchByValue: string = (this.getApplicationSection.get('search_by')) ? this.getApplicationSection.get('search_by').value : '';
    let searchByFtCodeControl = this.getApplicationSection.get('search_by_ft_code');
    let applicationControl = this.getApplicationSection.get('application');

    switch(searchByValue) {
      case this.searchBy.ftCode:
        this.searchByFtCode = true;
        // clear all fields for "Fast Track Item Info"
        (applicationControl) ? applicationControl.setValue([], {emitEvent: false}) : false;
        
        break;
      case this.searchBy.application:
        this.searchByFtCode = false;
        // clear search_by_ft_code field, when Search by Application
        (searchByFtCodeControl) ? searchByFtCodeControl.setValue([], {emitEvent: false}) : false;

        break;
      default:
        this.searchByFtCode = false;
        break;
    }
  }

  getFtCodeList() {    
    // GET ftCodeList
    let copyApplications: ApplicationModel[] = _.cloneDeep(this.applications);
    this.ftCodeList = _.flattenDeep(_.map(copyApplications, (appItem) => { // merge all arrays of codes into one
      let validFtItems: FtItemsModel[] = (appItem && appItem.fast_track && Array.isArray(appItem.fast_track.items))
        ? this.getValidFtItems(appItem.fast_track.items)
        : [];

      return validFtItems
        .map(item => (item && item.code))
        .filter(item => item);
    }));

    // PRESELECT ftCodeList
    this.preselectFtCodeList();
  }

  preselectFtCodeList() {
    let searchByFtCodeControl = this.getApplicationSection.get('search_by_ft_code');
    let searchByFtCodeValue: string[]  = (searchByFtCodeControl) ? _.cloneDeep(searchByFtCodeControl.value) : [];
    
    let preselectSearchByFtCodeValue: string[] = searchByFtCodeValue
      .filter(item => (this.ftCodeList.find(ftCodeItem => item === ftCodeItem)) ? item : null);
    
    if (searchByFtCodeControl) {
      searchByFtCodeControl.setValue(preselectSearchByFtCodeValue, {emitEvent: false});
      searchByFtCodeControl.markAsPristine();
    }
  }

  preselectFieldsByFtCode() {
    let searchByFtCodeControl = this.getApplicationSection.get('search_by_ft_code');
    let searchByFtCodeValue: string[]  = (searchByFtCodeControl) ? _.cloneDeep(searchByFtCodeControl.value) : [];
    let searchByFtCodeSingle: string = this.getValueSingleSelect(searchByFtCodeValue) || '';

    let searchByControl = this.getApplicationSection.get('search_by');
    let searchByValue: string = (searchByControl) ? searchByControl.value : '';
    let applicationControl = this.getApplicationSection.get('application');
    let applicationProductControl = this.getApplicationSection.get('application_product');
    let thicknessControl = this.getProductSection.get('thickness');
    let dimensionControl = this.getDimensionsSection.get('dimension');
    let numberOfColorsControl = this.getGraphicsSection.get('number_of_colors');

    // GET application and item
    let foundApplication: ApplicationModel = this.applications.find(appItem => (appItem && appItem.fast_track && Array.isArray(appItem.fast_track.items) && appItem.fast_track.items.find(item => (item && item.code === searchByFtCodeSingle))));
    let foundItem: FtItemsModel = (foundApplication && foundApplication.fast_track && Array.isArray(foundApplication.fast_track.items))
      ? foundApplication.fast_track.items.find(item => (item && item.code === searchByFtCodeSingle))
      : null;
    
    // CHECKS
    if (!searchByFtCodeSingle && searchByValue === this.searchBy.ftCode) { // clear all fields for "Fast Track Item Info"
      applicationControl.setValue([], {emitEvent: false});
      return false;
    }
    else if (this.ftItemInfo && searchByFtCodeSingle && this.ftItemInfo.code === searchByFtCodeSingle) { return false; } // the same item
    else if (!searchByFtCodeSingle || !foundApplication || !foundItem) { return false; }
    else if (!applicationControl || !applicationProductControl || !thicknessControl || !dimensionControl || !numberOfColorsControl) { return false; }

    // PRESELECT applicationList
    let fieldApplicationValue: CategoryModel = (Array.isArray(foundApplication.application))
      ? this.applicationList.find(item => item.id === foundApplication.application[0])
      : null;
    let preselectApplicationValue: CategoryModel[] = (fieldApplicationValue) ? [fieldApplicationValue] : [];
    applicationControl.setValue(preselectApplicationValue, {emitEvent: false});
    applicationControl.markAsTouched();

    // PRESELECT applicationProductList
    let fieldApplicationProductItem: MultiSelectModel = this.getApplicationProductItem(foundApplication);
    let fieldApplicationProductValue: MultiSelectModel = (fieldApplicationProductItem)
      ? this.applicationProductList.find(item => item.id === fieldApplicationProductItem.id)
      : null;
    let preselectApplicationProductValue: MultiSelectModel[] = (fieldApplicationProductValue) ? [fieldApplicationProductValue] : [];
    applicationProductControl.setValue(preselectApplicationProductValue, {emitEvent: false});
    applicationProductControl.markAsTouched();

    // PRESELECT thicknessList
    let fieldThicknessValue: ThicknessItemModel = this.thicknessList.find(item => item.title === foundItem.thickness);
    let preselectThicknessValue: ThicknessItemModel[] = (fieldThicknessValue) ? [fieldThicknessValue] : [];
    thicknessControl.setValue(preselectThicknessValue, {emitEvent: false});
    thicknessControl.markAsTouched();
    
    // PRESELECT dimensionList
    let fieldDimensionValue: DimensionItemModel = this.dimensionList.find(item => item.size === foundItem.dimension.size);
    let preselectDimensionValue: DimensionItemModel[] = (fieldDimensionValue) ? [fieldDimensionValue] : [];
    dimensionControl.setValue(preselectDimensionValue, {emitEvent: false});
    dimensionControl.markAsTouched();

    // PRESELECT numberOfColorsList
    let fieldNumberOfColorsValue: number = this.numberOfColorsList.find(item => item === foundItem.color);
    let preselectNumberOfColorsValue: number[] = (fieldNumberOfColorsValue) ? [fieldNumberOfColorsValue] : [];
    numberOfColorsControl.setValue(preselectNumberOfColorsValue, {emitEvent: false});
    numberOfColorsControl.markAsTouched();
  }

  getApplicationList() {
    const APPLICATION = AppConstants.MainCategoryNames.APPLICATION;
    let applicationListParent = this.categories
      .find((category) => (category.title === APPLICATION.title && category.level === APPLICATION.level) );
    
    // GET applicationList
    this.applicationList = [];
    if (applicationListParent) {
      let secondLevelList: CategoryModel[] = this.multiSelectService.getDropdownById(this.categories, applicationListParent.id);
      let secondLevelIds: number[] = _.cloneDeep(secondLevelList)
        .map(item => item.id)
        .filter(id => (id && typeof id === 'number' && id > 0));
      this.applicationList = this.multiSelectService.getDropdownByArray(this.categories, secondLevelIds);

      // show Application Category only when Application has valid Fast Track items
      this.applicationList = _.cloneDeep(this.applicationList)
        .filter(categoryItem => {
          let filteredApplications: ApplicationModel[] = _.cloneDeep(this.applications)
            .filter(item => (item && Array.isArray(item.application)) ? item.application.find(appId => appId === categoryItem.id) : null)
            .filter(item => { // applications only with valid Fast Track Items
              let ftItems: FtItemsModel[] = (item && item.fast_track && Array.isArray(item.fast_track.items))
                ? this.getValidFtItems(item.fast_track.items)
                : [];

              return (ftItems && ftItems.length);
            });

          return (filteredApplications && filteredApplications.length); // when applications are valid
        });
    }

    // PRESELECT applicationList
    this.preselectApplicationList();
  }

  preselectApplicationList() {
    let applicationControl = this.getApplicationSection.get('application');
    let applicationValue: CategoryModel[]  = (applicationControl) ? _.cloneDeep(applicationControl.value) : [];
    
    let preselectApplicationValue: CategoryModel[] = applicationValue
      .filter(item => (this.applicationList.find(categoryItem => item.id === categoryItem.id)) ? item : null);
    
    if (applicationControl) {
      applicationControl.setValue(preselectApplicationValue, {emitEvent: false});
      applicationControl.markAsPristine();
    }
  }

  getApplicationProductList() {
    let applicationControl = this.getApplicationSection.get('application');
    let applicationValueSingle: CategoryModel = (applicationControl) ? this.getValueSingleSelect(applicationControl.value) : null;

    // GET applicationProductList
    this.applicationProductList = [];
    if (applicationValueSingle) {
      let filteredApplications: ApplicationModel[] = _.cloneDeep(this.applications)
        .filter(item => (item && Array.isArray(item.application)) ? item.application.find(appId => appId === applicationValueSingle.id) : null)
        .filter(item => { // applications only with valid Fast Track Items
          let ftItems: FtItemsModel[] = (item && item.fast_track && Array.isArray(item.fast_track.items))
            ? this.getValidFtItems(item.fast_track.items)
            : [];

          return (ftItems && ftItems.length);
        });
      
      this.applicationProductList = filteredApplications
        .map(item => this.getApplicationProductItem(item))
        .filter(item => item);
    }

    // PRESELECT applicationProductList
    this.preselectApplicationProductList();
  }

  getApplicationProductItem(applicationItem: ApplicationModel): MultiSelectModel {
    let appType: CategoryModel = (applicationItem && applicationItem.type) ? this.categories.find(category => category.id === applicationItem.type) : null;
    let appProduct: ProductModel = (applicationItem && Array.isArray(applicationItem.product) && applicationItem.product.length) ? this.products.find(product => product.id === applicationItem.product[0]) : null;
    let obj: MultiSelectModel = {
      id: (applicationItem) ? applicationItem.id : null, // Application id
      title: `${(appType) ? appType.title : ''} ${(appProduct) ? appProduct.title : ''}`, // Application type + Product
    };

    return (appType && appProduct) ? obj : null;
  }

  preselectApplicationProductList() {
    let applicationProductControl = this.getApplicationSection.get('application_product');
    let applicationProductValue: CategoryModel[]  = (applicationProductControl) ? _.cloneDeep(applicationProductControl.value) : [];
    
    let preselectApplicationProductValue: CategoryModel[] = applicationProductValue
      .filter(item => (this.applicationProductList.find(categoryItem => item.id === categoryItem.id)) ? item : null);
    
    if (applicationProductControl) {
      applicationProductControl.setValue(preselectApplicationProductValue, {emitEvent: false});
      applicationProductControl.markAsPristine();
    }
  }

  getApplicationInfo() {
    let applicationProductControl = this.getApplicationSection.get('application_product');
    let applicationProductValue: MultiSelectModel[] = (applicationProductControl) ? _.cloneDeep(applicationProductControl.value) : [];
    let applicationProductValueSingle: MultiSelectModel = this.getValueSingleSelect(applicationProductValue);

    this.applicationInfo = (applicationProductValueSingle)
      ? this.applications.find(appItem => appItem.id === applicationProductValueSingle.id)
      : null;

    // GET data
    this.preselectFieldsByApplicationInfo();  
  }

  preselectFieldsByApplicationInfo() {
    // PRESELECT packaging
    let packagingControl = this.getApplicationSection.get('packaging');
    let applicationCategory: CategoryModel = (this.applicationInfo && Array.isArray(this.applicationInfo.application) && this.applicationInfo.application.length)
      ? this.categories.find(category => category.id === this.applicationInfo.application[0]) // single select
      : null;
    let packagingCategory: CategoryModel = (applicationCategory)
      ? this.categories.find(category => category.id === applicationCategory.parent_id)
      : null;
    if (packagingControl) {
      let value: CategoryModel[] = (packagingCategory) ? [packagingCategory] : [];
      packagingControl.setValue(value, {emitEvent: false});
      packagingControl.markAsTouched();
    }

    // PRESELECT application_type
    let applicationTypeControl = this.getApplicationSection.get('application_type');
    let applicationTypeCategory: CategoryModel = (this.applicationInfo && this.applicationInfo.type)
      ? this.categories.find(category => category.id === this.applicationInfo.type)
      : null;
    if (applicationTypeControl) {
      let value: CategoryModel[] = (applicationTypeCategory) ? [applicationTypeCategory] : [];
      applicationTypeControl.setValue(value, {emitEvent: false});
      applicationTypeControl.markAsTouched();
    }

    // PRESELECT product and product_family
    let productControl = this.getProductSection.get('product');
    let productFamilyControl = this.getProductSection.get('product_family');
    let productInfo: ProductModel = (this.applicationInfo && Array.isArray(this.applicationInfo.product) && this.applicationInfo.product.length)
      ? this.products.find(product => product.id === this.applicationInfo.product[0]) // single select
      : null;
    let productFamilyCategory: CategoryModel = (productInfo && Array.isArray(productInfo.family) && productInfo.family.length)
      ? this.categories.find(category => category.id === productInfo.family[0]) // single select
      : null;
    if (productControl) {
      let value: ProductModel[] = (productInfo) ? [productInfo] : [];
      productControl.setValue(value, {emitEvent: false});
      productControl.markAsTouched();
    }
    if (productFamilyControl) {
      let value: CategoryModel[] = (productFamilyCategory) ? [productFamilyCategory] : [];
      productFamilyControl.setValue(value, {emitEvent: false});
      productFamilyControl.markAsTouched();
    }
  }

  getThicknessList() {
    let applicationProductControl = this.getApplicationSection.get('application_product');
    let validFtItems: FtItemsModel[] = this.getValidFtItems();

    // GET thicknessList
    this.thicknessList = [];
    if ((applicationProductControl && applicationProductControl.valid) && this.applicationInfo) {
      let list: ThicknessItemModel[] = validFtItems.map(item => ({
        id: item.code,
        title: item.thickness,
      }));
      this.thicknessList = _.uniqBy(list, 'title'); // unique by title
    }

    // PRESELECT thicknessList
    this.preselectThicknessList();
  }

  preselectThicknessList() {
    let thicknessControl = this.getProductSection.get('thickness');
    let thicknessValue: ThicknessItemModel[]  = (thicknessControl) ? _.cloneDeep(thicknessControl.value) : [];
    
    let preselectThicknessValue: ThicknessItemModel[] = thicknessValue
      .filter(item => (this.thicknessList.find(thicknessItem => item.title === thicknessItem.title)) ? item : null);
    
    if (thicknessControl) {
      thicknessControl.setValue(preselectThicknessValue, {emitEvent: false});
      thicknessControl.markAsPristine();
    }
  }

  getDimensionList() {
    let thicknessControl = this.getProductSection.get('thickness');
    let validFtItems: FtItemsModel[] = this.getValidFtItems();

    // GET dimensionList
    this.dimensionList = [];
    if ((thicknessControl && thicknessControl.valid) && this.applicationInfo) {
      let list: DimensionItemModel[] = validFtItems
        .map(item => {
          if (!item.dimension) { return null; }
          
          let partSize: string = `${(typeof item.dimension.size === 'number') ? item.dimension.size + ':' : ''}`;
          let partWidth: string = `${(typeof item.dimension.width === 'number') ? 'W: '+item.dimension.width : ''}`;
          let partHeight: string = `${(typeof item.dimension.height === 'number') ? '| H: '+item.dimension.height : ''}`;
          let partFlap: string = `${(typeof item.dimension.flap === 'number') ? '| F: '+item.dimension.flap : ''}`;
          let partGusset: string = `${(typeof item.dimension.gusset === 'number') ? '| G: '+item.dimension.gusset : ''}`;

          return ({
            id: `${partSize} ${partWidth} ${partHeight} ${partFlap} ${partGusset}`,
            title: `${partSize} ${partWidth} ${partHeight} ${partFlap} ${partGusset}`,
            size: item.dimension.size,
            width: item.dimension.width,
            height: item.dimension.height,
            flap: item.dimension.flap,
            gusset: item.dimension.gusset,
          });
        })
        .filter(item => item);
      this.dimensionList = _.uniqWith(list, _.isEqual); // only unique
    }

    // PRESELECT dimensionList
    this.preselectDimensionList();
  }

  preselectDimensionList() {
    let dimensionControl = this.getDimensionsSection.get('dimension');
    let dimensionValue: DimensionItemModel[]  = (dimensionControl) ? _.cloneDeep(dimensionControl.value) : [];
    
    let preselectDimensionValue: DimensionItemModel[] = dimensionValue
      .filter(item => (this.dimensionList.find(dimensionItem => item.title === dimensionItem.title)) ? item : null);
    
    if (dimensionControl) {
      dimensionControl.setValue(preselectDimensionValue, {emitEvent: false});
      dimensionControl.markAsPristine();
    }
  }

  preselectFieldsByDimension() {
    let dimensionControl = this.getDimensionsSection.get('dimension');
    let dimensionValueSingle: (DimensionItemModel | MultiSelectModel)  = (dimensionControl) ? this.getValueSingleSelect(dimensionControl.value) : null;
    let dimensionFullItem: DimensionItemModel = (dimensionValueSingle)
      ? this.dimensionList.find(item => item.title === dimensionValueSingle.title) // title is unique
      : null;

    // PRESELECT width
    let widthControl = this.getDimensionsSection.get('width');
    if (widthControl) {
      let value: number = (dimensionFullItem && typeof dimensionFullItem.width === 'number') ? dimensionFullItem.width : null;
      widthControl.setValue(value, {emitEvent: false});
      widthControl.markAsTouched();
    }

    // PRESELECT height
    let heightControl = this.getDimensionsSection.get('height');
    if (heightControl) {
      let value: number = (dimensionFullItem && typeof dimensionFullItem.height === 'number') ? dimensionFullItem.height : null;
      heightControl.setValue(value, {emitEvent: false});
      heightControl.markAsTouched();
    }

    // PRESELECT flap
    let flapControl = this.getDimensionsSection.get('flap');
    if (flapControl) {
      let value: number = (dimensionFullItem && typeof dimensionFullItem.flap === 'number') ? dimensionFullItem.flap : null;
      flapControl.setValue(value, {emitEvent: false});
      flapControl.markAsTouched();
    }

    // PRESELECT closed_gusset
    let closedGussetControl = this.getDimensionsSection.get('closed_gusset');
    if (closedGussetControl) {
      let value: number = (dimensionFullItem && typeof dimensionFullItem.gusset === 'number') ? dimensionFullItem.gusset : null;
      closedGussetControl.setValue(value, {emitEvent: false});
      closedGussetControl.markAsTouched();
    }
  }

  getNumberOfColorsList() {
    let dimensionControl = this.getDimensionsSection.get('dimension');
    let validFtItems: FtItemsModel[] = this.getValidFtItems();

    // GET numberOfColorsList
    this.numberOfColorsList = [];
    if ((dimensionControl && dimensionControl.valid) && this.applicationInfo) {
      let list: number[] = validFtItems
        .map(item => (item) ? item.color : null)
        .filter(item => item);
      this.numberOfColorsList = _.uniqWith(list, _.isEqual); // only unique
    }

    // PRESELECT numberOfColorsList
    this.preselectNumberOfColorsList();
  }

  preselectNumberOfColorsList() {
    let numberOfColorsControl = this.getGraphicsSection.get('number_of_colors');
    let numberOfColorsValue: number[]  = (numberOfColorsControl) ? _.cloneDeep(numberOfColorsControl.value) : [];
    
    let preselectNumberOfColorsValue: number[] = numberOfColorsValue
      .filter(item => (this.numberOfColorsList.find(colorItem => item === colorItem)) ? item : null);
    
    if (numberOfColorsControl) {
      numberOfColorsControl.setValue(preselectNumberOfColorsValue, {emitEvent: false});
      numberOfColorsControl.markAsPristine();
    }
  }

  getMoq() {
    let moqControl = this.getPricingSection.get('moq');
    if (moqControl) {
      moqControl.setValue((this.ftItemInfo) ? this.ftItemInfo.moq : null, {emitEvent: false});
      moqControl.markAsPristine();
    }
  }

  getFtItemInfo() {
    let thicknessValueSingle = (this.getProductSection.get('thickness')) ? this.getValueSingleSelect(this.getProductSection.get('thickness').value) : null;
    let dimensionValueSingle = (this.getDimensionsSection.get('dimension')) ? this.getValueSingleSelect(this.getDimensionsSection.get('dimension').value) : null;
    let dimensionFullItem: DimensionItemModel = (dimensionValueSingle)
      ? this.dimensionList.find(item => item.title === dimensionValueSingle.title) // title is unique
      : null;
    let numberOfColorsValueSingle: number = (this.getGraphicsSection.get('number_of_colors')) ? this.getValueSingleSelect(this.getGraphicsSection.get('number_of_colors').value) : null;
    let validFtItems: FtItemsModel[] = this.getValidFtItems();

    // GET ftItemInfo
    this.ftItemInfo = null;
    if (this.applicationInfo && thicknessValueSingle && dimensionFullItem && numberOfColorsValueSingle) {
      this.ftItemInfo = validFtItems.find(item => {
        let thicknessIsEqual: boolean = (item.thickness === thicknessValueSingle.title);
        let dimensionIsEqual: boolean = (item.dimension.size === dimensionFullItem.size);
        let colorIsEqual: boolean = (item.color === numberOfColorsValueSingle);

        return (thicknessIsEqual && dimensionIsEqual && colorIsEqual);
      });
    }

    // GET data
    this.getMoq();
    this.getFastTrackCode();
    this.getAdditionalFeaturesList();
    this.validatorsFtRfqPriceList();
  }

  getValidFtItems(ftItems?: FtItemsModel[]): FtItemsModel[] {
    let list: FtItemsModel[] = [];

    if (ftItems && Array.isArray(ftItems)) {
      list = _.cloneDeep(ftItems);
    } else if (this.applicationInfo && this.applicationInfo.fast_track && Array.isArray(this.applicationInfo.fast_track.items)) {
      list = _.cloneDeep(this.applicationInfo.fast_track.items);
    } else {
      list = [];
    }

    return _.cloneDeep(list).filter(item => (item && item.visible)); // only visible Fast Track Items
  }

  getAdditionalFeaturesList() {
    let additionalFeaturesSection: RfqFormModelAdditionalFeaturesSection[] = [];
    let additionalFeaturesList: RfqFormModelAdditionalFeature[] = [];

    while (this.getAdditionalFeaturesSection.length !== 0) {
      this.getAdditionalFeaturesSection.removeAt(0);
    }

    // GET additional_features form Fast Track
    let basicList: AdditionalFeaturesModel[] = (this.applicationInfo && this.applicationInfo.fast_track && Array.isArray(this.applicationInfo.fast_track.additional_features))
      ? _.cloneDeep(this.applicationInfo.fast_track.additional_features)
      : [];

    // CHECKS
    if (!this.ftItemInfo || !this.applicationInfo) { return false; }
    else if (!Array.isArray(basicList) || !basicList.length) { return false; } // additional_features are empty

    basicList.map(item => {
      item.ids.map(id => {
        let additional_feature: CategoryModel = (typeof id === 'number')
          ? this.categories.find(category => category.id === id)
          : null;
        let additional_feature_parent: CategoryModel = (additional_feature)
          ? this.categories.find(category => category.id === additional_feature.parent_id)
          : null;

        if (additional_feature && additional_feature_parent) {
          additionalFeaturesList.push({
            stage: item.stage,
            mandatory: item.mandatory,
            selected: item.mandatory,
            id: additional_feature.id,
            additional_feature: additional_feature.title,
            additional_feature_parent: additional_feature_parent.title,
            additional_feature_hints: (additional_feature.metadata && additional_feature.metadata.hints && additional_feature.metadata.hints.length)
              ? additional_feature.metadata.hints.map(hintItem => ({
                hint_name: hintItem.title,
                hint_value: '',
              }))
              : []
          });
        }
      });
    });

    // TREE
    let objGrouped = _.groupBy(additionalFeaturesList, item => item.additional_feature_parent);
    let arrGrouped: RfqFormModelAdditionalFeaturesSection[] = _.map(objGrouped, (value, key) => ({
      parent: key,
      list: _.orderBy(value, ['additional_feature_parent', 'additional_feature'], ['asc', 'asc']) // sorting by parent and feature
    }));
    arrGrouped = _.orderBy(arrGrouped, ['parent'], ['asc']); // sorting by parent
    arrGrouped = arrGrouped.filter(item => (item.list.length) ? true : false);

    additionalFeaturesSection = arrGrouped;

    // building tree form
    additionalFeaturesSection.map(item => {
      this.getAdditionalFeaturesSection.push(new FormGroup({
        parent: new FormControl(item.parent),
        list: new FormArray([
          ...item.list.map(itemFeature => {
            // mandatory
            let mandatoryValue: boolean = itemFeature.mandatory;

            // selected
            let selectedValue: boolean = (mandatoryValue) ? !!(mandatoryValue) : false;

            return new FormGroup({
              stage: new FormControl(itemFeature.stage),
              mandatory: new FormControl(mandatoryValue),
              selected: new FormControl({value: selectedValue, disabled: mandatoryValue}),
              id: new FormControl(itemFeature.id),
              additional_feature: new FormControl(itemFeature.additional_feature),
              additional_feature_parent: new FormControl(itemFeature.additional_feature_parent),
              additional_feature_hints: new FormArray([
                ...itemFeature.additional_feature_hints.map(featureHint => {
                  return new FormGroup({
                    hint_name: new FormControl(featureHint.hint_name),
                    hint_value: new FormControl(featureHint.hint_value),
                  });
                })
              ]),
            });
          })
        ]),
      }));
    });
  }

  validatorsAdditionalFeaturesList() {
    // map by tree
    // when additional feature is selected, all hints of feature should be required
    // hints are not required by default
    this.getAdditionalFeaturesSection.controls.map(item => {
      let list = item.get('list') as FormArray;
      
      list.controls.map(itemFeature => {
        const mandatory: boolean = itemFeature.get('mandatory').value;
        const selected: boolean = itemFeature.get('selected').value;
        let hints = itemFeature.get('additional_feature_hints') as FormArray;

        hints.controls.map(itemHint => {
          if (mandatory || selected) { // additional feature is selected
            itemHint.get('hint_value').setValidators([Validators.required]);
            itemHint.get('hint_value').updateValueAndValidity();
          } else { // additional feature is not selected
            itemHint.get('hint_value').clearValidators();
            itemHint.get('hint_value').updateValueAndValidity();
          }

          return itemHint;
        });

        return itemFeature;
      });

      return item;
    });
  }

  getInitialPricingMeasureUnitValue(): PricingMeasureUnit[] {
    let pricingMeasureUnitItem: PricingMeasureUnit = (this.pricingMeasureUnitList.length)
      ? this.pricingMeasureUnitList.find(item => item.title === this.RFQ.pricingMeasureUnitNames.units)
      : null;
    return (pricingMeasureUnitItem) ? [pricingMeasureUnitItem] : [];
  }

  calculateFtRfqPriceList() {
    // IMPORTANT SET ftItemInfo for calculate
    this.calculatedPriceListFtItemInfo = this.ftItemInfo;

    // RESET by default
    while (this.getPricingSectionPriceList.length !== 0) {
      this.getPricingSectionPriceList.removeAt(0);
    }

    // return when ftItemInfo is empty
    if (!this.ftItemInfo) { return false; }

    // GET list
    this.quoteRequestService.calculateFtRfqPriceList(this.ftItemInfo).subscribe(
      (res) => {
        if (!Array.isArray(res)) { return false; }

        res.map(item => {
          this.getPricingSectionPriceList.push(new FormGroup({
            from_qty: new FormControl(item.from_qty),
            to_qty: new FormControl(item.to_qty),
            price_usd: new FormControl(item.price_usd),
            price_eur: new FormControl(item.price_eur),
          }));
        });
      },
      (err: HttpErrorResponse) => {
        this.alertService.showError(err.error.message);
      }
    );
  }

  validatorsFtRfqPriceList() {
    // Validators
    if (this.calculatedPriceListFtItemInfo) {
      if (!this.ftItemInfo) { // Recalculate
        this.getPricingSectionPriceList.setErrors({recalculate: true});
      } else if (this.ftItemInfo && this.calculatedPriceListFtItemInfo.code !== this.ftItemInfo.code) { // Recalculate
        this.getPricingSectionPriceList.setErrors({recalculate: true});
      } else { // Ok
        this.getPricingSectionPriceList.setErrors(null);
      }
    } else { // Required
      this.getPricingSectionPriceList.setErrors({required: true});
    }
  }

  getFastTrackCode() {
    let fastTrackCodeControl = this.getPricingSection.get('fast_track_code');
    let value: string = (this.ftItemInfo) ? this.ftItemInfo.code || '' : '';

    if (fastTrackCodeControl) {
      fastTrackCodeControl.setValue(value, {emitEvent: false});
      fastTrackCodeControl.markAsTouched();
    }
  }

  saveRfqForm(submitAndClose: boolean) {
    let data: RfqModel = this.transformData(this.rfqForm.value);
    let canBePriced: boolean = this.getCanBePriced();

    if (this.rfqForm.invalid) {
      this.rfqForm.markAllAsTouched();
      this.scrollToFirstInvalidControl();
      return;
    }

    this.quoteRequestService.createRfq(data, canBePriced).subscribe(
      (res) => {
        window.scrollTo(0,0);

        // After submit -> close popup true/false
        if (submitAndClose) {
          this.alertService.showSuccess(res['message']);
          this.closePage();
        } else {
          this.alertService.showSuccess("Edit fields to generate another item");
        }
      },
      (err: HttpErrorResponse) => {
        this.alertService.showError(err.error.message);
      }
    );
  }

  transformData(formData: RfqFormModel): RfqModel {
    const data: RfqModel = {
      type: '',
      form_mode: null,
      opportunity_section: null,
      segment_section: {
        segment: null,
        segment_type: null,
        packed_goods: null,
        expected_shelf_life: '',
      },
      application_section: {
        packaging: null,
        application: null,
        application_type: null,
        estimated_application_type: null,
      },
      product_section: {
        product_family: null,
        product: null,
        film_grade: '',
        thickness: null,
        manufacturing_technique: '',  
      },
      additional_features_section: [],
      dimensions_section: {
        width: null,
        height: null,
        flap: null,
        closed_gusset: null,
        core: null,
        reel_length_limitation: '',
        box_weight_limitation: '',
        od: '',
        reel_weight_limitation: '',
        cof: null,
      },
      graphics_section: {
        printing: null,
        digital_printing: null,
        number_of_colors: null,
        rtf: '',
        external_logo: [],
      },
      pricing_section: {
        currency: '',
        shipping_terms: '',
        pricing_measure_unit: '',
        imp_width: null,
        imp_height: null,
        moq: null,
        annual_quantity_potential: '',
        current_material_used: '',
        current_price_payed: null,
        items: [],
        remarks: '',
        fast_track_code: '',
        price_list: [],  
      },
      feedback_section: {
        packed_goods: [],
        production: [],
        pricing:[],
      },
      other_section: {
        rfq_is_for: '',
      },
    };

    // type
    data.type = AppConstants.RfqFormTypeNames.FAST_TRACK || ''; // type always should be FAST_TRACK

    // form_mode
    data.form_mode = null; // empty for Fast Track

    // opportunity_section
    data.opportunity_section = (this.opportunitySection)
      ? {...this.opportunitySection}
      : null;

    // Other's fields
    data.other_section.rfq_is_for = ''; // empty for Fast Track

    // Segment's fields
    let selectedSegment: CategoryModel = this.getValueSingleSelect(formData.segment_section.segment);
    data.segment_section.segment = (selectedSegment)
      ? ({
        id: selectedSegment.id,
        title: selectedSegment.title
      })
      : null;
    let selectedSegmentType: CategoryModel = this.getValueSingleSelect(formData.segment_section.segment_type);
    data.segment_section.segment_type = (this.segmentTypeIsOther)
      ? (selectedSegmentType)
        ? ({
          id: selectedSegmentType.id,
          title: formData.segment_section.other_segment_type,
        })
        : null
      : (selectedSegmentType)
        ? ({
          id: selectedSegmentType.id,
          title: selectedSegmentType.title
        })
        : null;
    let selectedPackedGoods: CategoryModel = this.getValueSingleSelect(formData.segment_section.packed_goods);
    data.segment_section.packed_goods = (this.packedGoodsIsOther)
      ? (selectedPackedGoods)
        ? ({
          id: selectedPackedGoods.id,
          title: formData.segment_section.other_packed_goods,
        })
        : null
      : (selectedPackedGoods)
        ? ({
          id: selectedPackedGoods.id,
          title: selectedPackedGoods.title,
        })
        : null;
    data.segment_section.expected_shelf_life = formData.segment_section.expected_shelf_life;

    // Application's fields
    let selectedPackaging: CategoryModel = this.getValueSingleSelect(formData.application_section.packaging);
    data.application_section.packaging = (selectedPackaging)
      ? ({
        id: selectedPackaging.id,
        title: selectedPackaging.title,
      })
      : null;
    let selectedApplication: CategoryModel = this.getValueSingleSelect(formData.application_section.application);
    data.application_section.application = (selectedApplication)
      ? ({
        id: selectedApplication.id,
        title: selectedApplication.title,
      })
      : null;
    let selectedApplicationType: CategoryModel = this.getValueSingleSelect(formData.application_section.application_type);
    data.application_section.application_type = (this.getValueIsOtherCategory(selectedApplicationType))
      ? (selectedApplicationType)
        ? ({
          id: selectedApplicationType.id,
          title: formData.application_section.other_application_type,
        })
        : null
      : (selectedApplicationType)
        ? ({
          id: selectedApplicationType.id,
          title: selectedApplicationType.title,
        })
        : null;
    data.application_section.estimated_application_type = null; // empty for Fast Track

    // Product's fields
    let selectedProductFamily: CategoryModel = this.getValueSingleSelect(formData.product_section.product_family);
    data.product_section.product_family = (selectedProductFamily)
      ? ({
        id: selectedProductFamily.id,
        title: selectedProductFamily.title,
      })
      : null;
    let selectedProduct: CategoryModel = this.getValueSingleSelect(formData.product_section.product);
    data.product_section.product = (selectedProduct)
      ? ({
        id: selectedProduct.id,
        title: selectedProduct.title,
      })
      : null;
    data.product_section.film_grade = (formData.product_section.film_grade && formData.product_section.film_grade.length)
      ? formData.product_section.film_grade[0].title
      : '';
    data.product_section.manufacturing_technique = formData.product_section.manufacturing_technique;
    let selectedThickness = this.getValueSingleSelect(formData.product_section.thickness);
    data.product_section.thickness = (selectedThickness) ? Number(selectedThickness.title) : 0;

    // AdditionalFeaturesSection's fields
    data.additional_features_section = [];
    formData.additional_features_section.map(item => {
      item.list.map(itemFeature => {
        if (itemFeature.mandatory || itemFeature.selected) {
          data.additional_features_section.push({
            id: itemFeature.id,
            additional_feature: itemFeature.additional_feature,
            additional_feature_parent: itemFeature.additional_feature_parent,
            additional_feature_hints: itemFeature.additional_feature_hints,
          });
        }
        
        return itemFeature;
      });

      return item;
    });

    // Dimensions's fields
    data.dimensions_section.width = +formData.dimensions_section.width;
    data.dimensions_section.height = +formData.dimensions_section.height;
    data.dimensions_section.flap = formData.dimensions_section.flap;
    data.dimensions_section.closed_gusset = formData.dimensions_section.closed_gusset;
    data.dimensions_section.core = null; // empty for Fast Track
    data.dimensions_section.reel_length_limitation = ''; // empty for Fast Track
    data.dimensions_section.box_weight_limitation = ''; // empty for Fast Track
    data.dimensions_section.od = ''; // empty for Fast Track
    data.dimensions_section.reel_weight_limitation = ''; // empty for Fast Track
    data.dimensions_section.cof = null; // empty for Fast Track

    // Graphics's fields
    data.graphics_section.printing = Boolean(formData.graphics_section.printing);
    data.graphics_section.digital_printing = Boolean(formData.graphics_section.digital_printing);
    data.graphics_section.number_of_colors = this.getValueSingleSelect(formData.graphics_section.number_of_colors);
    data.graphics_section.rtf = ''; // empty for Fast Track
    data.graphics_section.external_logo = []; // empty for Fast Track

    // Pricing's fields
    data.pricing_section.currency = ''; // empty for Fast Track
    let selectedShippingTerms: string = this.getValueSingleSelect(formData.pricing_section.shipping_terms);
    data.pricing_section.shipping_terms = (selectedShippingTerms) ? selectedShippingTerms : '';
    data.pricing_section.pricing_measure_unit = (formData.pricing_section.pricing_measure_unit && formData.pricing_section.pricing_measure_unit.length) ? formData.pricing_section.pricing_measure_unit[0].title : '';
    data.pricing_section.imp_width = null; // empty for Fast Track
    data.pricing_section.imp_height = null; // empty for Fast Track
    data.pricing_section.moq = (!formData.pricing_section.moq || isNaN(Number(formData.pricing_section.moq))) ? null : Number(formData.pricing_section.moq);
    data.pricing_section.annual_quantity_potential = ''; // empty for Fast Track
    data.pricing_section.current_price_payed = null; // empty for Fast Track
    data.pricing_section.current_material_used = ''; // empty for Fast Track
    data.pricing_section.items = []; // empty for Fast Track
    data.pricing_section.remarks = '';
    data.pricing_section.fast_track_code = (formData.pricing_section.fast_track_code) ? String(formData.pricing_section.fast_track_code) : '';
    data.pricing_section.price_list = (formData.pricing_section.price_list && Array.isArray(formData.pricing_section.price_list))
      ? formData.pricing_section.price_list
      : [];

    // Feedback's fields
    data.feedback_section.packed_goods = []; // empty for Fast Track
    data.feedback_section.production = []; // empty for Fast Track
    data.feedback_section.pricing = []; // empty for Fast Track

    return data;
  }

  getCanBePriced(): boolean {
    let items: any[] = this.getPricingSectionPriceList.value;
    let canNot: boolean = !!items.find(item => (!item.from_qty || !item.to_qty || !item.price_usd || !item.price_eur) ? item : null);

    return (canNot) ? false : true;
  }

  getValueIsOtherCategory(value: CategoryModel): boolean {
    if (!value) { return false; }
    return (value && value.id === this.otherCategory.id && value.title === this.otherCategory.title) ? true : false;
  }

  getValueSingleSelect(value: any[]) {
    return (value && value.length) ? value[0] : null;
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

  scrollToFirstInvalidControl() {
    const firstInvalidControl: HTMLElement = this.elementRef.nativeElement.querySelector("form#form-fastTrack .ng-invalid");

    if (firstInvalidControl) {
      firstInvalidControl.scrollIntoView();
    }
  }

  getControlIsRequired(control: AbstractControl): boolean {
    if (!control || !control.validator) { return false; }

    const validator = control.validator({} as AbstractControl);    
    if (validator && validator.required) { return true; }

    return false;
  }

  closePage(): void {
    // window.close();
    window.parent.postMessage({
      'func': 'parentFunc',
      'message': 'Message from iframe.'
    }, "*");
  }
}
