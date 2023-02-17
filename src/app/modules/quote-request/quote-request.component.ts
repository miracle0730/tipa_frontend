import { Component, OnInit, OnDestroy, ElementRef, ViewChild, } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { ActivatedRoute, Router } from '@angular/router';
import { FormGroup, FormBuilder, FormControl, Validators, FormControlName, FormArray, AbstractControl,} from '@angular/forms';

// Services
import { QuoteRequestService, AlertService, MultiSelectService, ApplicationService, ProductService, CategoryService, } from '@services';

// Interfaces
import { CategoryModel, CertificateModel, ApplicationModel, RfqModel, RfqFormModel, ProductModel, RfqFormModelAdditionalFeaturesSection, ManufacturingTechniqueModel, FilmGradeModel, OpportunitySection, RfqFormModelAdditionalFeature, FeedbackSectionItem, PricingSectionItems, CofModel, StageItem, RfqFormModeModel, RfqShortItemModel, GraphicsSectionExternalLogo, RfqModelAdditionalFeaturesSection, AdditionalFeaturesModel, StageItemIdsModel, GetApplicationsParamsModel, GetProductsParamsModel, } from '@models';
export interface PricingMeasureUnit {
  id: number;
  title: string;
}
export interface WidthHeight {
  commer?: {
    min: number;
    max: number;
    stage: number;
    placeholder: string;
  };
  underDev?: {
    min: number;
    max: number;
    stage: number;
    placeholder: string;
  };
  futureDev?: {
    min: number;
    max: number;
    stage: number;
    placeholder: string;
  };
}
export interface ThicknessItem {
  id: string;
  title: number;
  stage: number;
  isCommercial: boolean;
  isUnderDev: boolean;
}

export interface FeedbackSectionTree {
  packed_goods: {
    newPackedGoods: FeedbackSectionItem;
    applTypeNotMatchPackedGoods: FeedbackSectionItem;
    // productNotMatchSegmentType: FeedbackSectionItem;
    productNotMatchPackedGoods: FeedbackSectionItem;
  };
  production: {
    applTypeIsUnderDev: FeedbackSectionItem;
    productIsUnderDev: FeedbackSectionItem;
    thicknessIsNotSK: FeedbackSectionItem;
    widthIsNotSK: FeedbackSectionItem;
    heightIsNotSK: FeedbackSectionItem;
    heightPlusFlapIsMoreMaxHeight: FeedbackSectionItem;
    coreIsUnderDev: FeedbackSectionItem;
    addFeatureIsNotSK: FeedbackSectionItem;
    digitalPrintingUnderDev: FeedbackSectionItem;
  };
  pricing: {
    quantityBelowMOQ: FeedbackSectionItem;
    priceToBeEvaluated: FeedbackSectionItem;
  };
}

// Constants
import { AppConstants } from '@core/app.constants';

// Libs
import { IDropdownSettings } from 'ng-multiselect-dropdown';
import { forkJoin, Observable, Subscription } from 'rxjs';
import { map, distinctUntilChanged, } from 'rxjs/operators';
import * as _ from 'lodash';

// ngx-bootstrap
import { TabsetComponent, TabDirective } from 'ngx-bootstrap/tabs';

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
  selector: 'app-quote-request',
  templateUrl: './quote-request.component.html',
  styleUrls: ['./quote-request.component.scss']
})
export class QuoteRequestComponent implements OnInit, OnDestroy {
  @ViewChild('staticTabs', { static: false }) staticTabs: TabsetComponent;

  public categoriesSubscription: Subscription;
  public applicationsSubscription: Subscription;
  public productsSubscription: Subscription;
  public opportunitySubscription: Subscription;
  public rfqSubscription: Subscription;
  public multiSubscription: Subscription;

  public isRedirectedFromZoho: boolean;
  public opportunityId: string;
  public userId: string;
  public rfqId: string;
  public action: string;
  public currency: string;
  public opportunitySection: OpportunitySection;

  // Feedback Section
  public feedbackSection: FeedbackSectionTree = {
    packed_goods: {
      newPackedGoods: {
        title: 'New Packed goods will be reviewed',
        checked: false,
      },
      applTypeNotMatchPackedGoods: {
        title: 'Application type is not in Sales Kit for the selected packed goods',
        checked: false,
      },
      // productNotMatchSegmentType: {
      //   title: 'Product is not in Sales Kit for the selected sub-segment',
      //   checked: false,
      // },
      productNotMatchPackedGoods: {
        title: 'Product is not in Sales Kit for the selected packed goods',
        checked: false,
      },
    },
    production: {
      applTypeIsUnderDev: {
        title: 'Selected Application Type is under development. See Terms and Limitations',
        checked: false,
      },
      productIsUnderDev: {
        title: 'Selected Product is under development See Terms and Limitations',
        checked: false,
      },
      thicknessIsNotSK: {
        title: 'Selected Thickness is not in Sales kit',
        checked: false,
      },
      widthIsNotSK: {
        title: 'Selected Width is not in Sales kit',
        checked: false,
      },
      heightIsNotSK: {
        title: 'Selected Height is not in Sales kit',
        checked: false,
      },
      heightPlusFlapIsMoreMaxHeight: {
        title: 'Height including flap exceeds the maximum height',
        checked: false,
      },
      coreIsUnderDev: {
        title: 'Selected Core is under development',
        checked: false,
      },
      addFeatureIsNotSK: {
        title: 'Selected Additional Feature is not in Sales kit',
        checked: false,
      },
      digitalPrintingUnderDev: {
        title: 'Digital Printing request will be reviewed',
        checked: false,
      },
    },
    pricing: {
      quantityBelowMOQ: {
        title: 'Quantity Below MOQ',
        checked: false,
      },
      priceToBeEvaluated: {
        title: 'Price to be evaluated',
        checked: false,
      },
    }
  };

  public RFQ = RFQ;
  public rfqForm: FormGroup;
  public formModeList: RfqFormModeModel[] = [...AppConstants.RfqFormModeList];
  public categories: CategoryModel[] = [];
  public applications: ApplicationModel[] = [];
  public products: ProductModel[] = [];
  public selectedProductInfo: ProductModel;
  public filteredApplications: ApplicationModel[] = [];
  public filteredApplicationInfo: ApplicationModel;
  public similarApplications: boolean;
  // Stage
  public stageItemIds: StageItemIdsModel = AppConstants.StageItemIds;
  public stageList: StageItem[] = _.cloneDeep(AppConstants.StageItemList);
  // Segment
  public segmentList: CategoryModel[] = [];
  public segmentTypeList: CategoryModel[] = [];
  public packetGoodsList: CategoryModel[] = [];
  public packedGoodsIsOther: boolean = false;
  // Application
  public packagingIsDisabled: boolean = false;
  public packagingList: CategoryModel[] = [];
  public applicationList: CategoryModel[] = [];
  public applicationIsDisabled: boolean = false;
  public allApplicationTypeList: CategoryModel[] = [];
  public estimatedApplicationTypeList: CategoryModel[] = [];
  public applicationTypeList: CategoryModel[] = [];
  public applicationTypeStageInfo: StageItem;
  public applicationTypeIsCommercial: boolean = false;
  public applicationTypeIsUnderDev: boolean = false;
  public applicationTypeNotMatchPackedGoods: boolean = false;
  public applicationTypeIsDisabled: boolean = false;
  public estimatedApplicationTypeIsVisible: boolean = false;
  public estimatedApplicationTypeIsOther: boolean = false;
  // Product
  public productStageInfo: StageItem;
  public productIsCommercial: boolean = false;
  public productIsUnderDev: boolean = false;
  public productNotMatchSegmentType: boolean = false;
  public productNotMatchPackedGoods: boolean = false;
  public allProductFamilyList: CategoryModel[] = [];
  public productFamilyList: CategoryModel[] = [];
  public productList: any[] = [];
  public productAndFamilyIsVisible: boolean;
  public filmGradeList: FilmGradeModel[] = [...AppConstants.FilmGradeList];
  public manufacturingTechniqueList: ManufacturingTechniqueModel[] = AppConstants.ManufacturingTechniqueList;
  public thicknessList: ThicknessItem[] = [];
  public selectedThickness: ThicknessItem;
  // Additional Features
  public additionalFeaturesSectionIsVisible: boolean = true;
  // Dimensions
  public coreList: CategoryModel[] = [];
  public coreIsCommercial: boolean = false;
  public coreIsUnderDev: boolean = false;
  public width: WidthHeight;
  public widthIsCommercial: boolean = false;
  public widthIsUnderDev: boolean = false;
  public height: WidthHeight;
  public heightIsCommercial: boolean = false;
  public heightIsUnderDev: boolean = false;
  public heightPlusFlapIsMoreMaxHeight: boolean = false;
  public isVisibleFlapField: boolean = false;
  public isVisibleGussetField: boolean = false;
  public cofList: CofModel[] = [
    {
      id: 1,
      title: 0.2,
    },
    {
      id: 2,
      title: 0.3,
    },
  ];

  // Graphics
  public graphicsSectionIsVisible: boolean = true;
  public externalLogoIsVisible: boolean = false; // false - because printing field false by default
  public digitalPrintingIsVisible: boolean = false; // false - because printing field false by default
  public digitalPrintingNotAvailableFilm: boolean = false; // false - because printing field false by default
  public digitalPrintingStageId: number = null;
  public printingStageId: number = null;
  public allNumberOfColorsList: number[] = [1,2,3,4,5,6,7,8,9,10];
  public numberOfColorsList: number[] = [...this.allNumberOfColorsList];
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
  public impFieldsIsVisible: boolean = false;
  public pricingMeasureUnitList: PricingMeasureUnit[] = JSON.parse(JSON.stringify(this.allPricingMeasureUnitList));
  public priceCurrencyList: string[] = ['EUR', 'USD'];
  public shippingTermsList: string[] = this.quoteRequestService.getShippingTermsList();
  // Other
  public rfqIsFor = this.quoteRequestService.getRfqIsFor();

  public naCategory: CategoryModel = {
    id: null,
    parent_id: null,
    level: null,
    title: 'N/A',
    createdAt: null,
    updatedAt: null,
    metadata: {}
  };

  public otherCategory: CategoryModel = {
    id: -1,
    parent_id: null,
    level: null,
    title: 'other',
    createdAt: null,
    updatedAt: null,
    metadata: {}
  };

  public convertingCategory: CategoryModel = {
    id: -2,
    parent_id: null,
    level: null,
    title: 'converting',
    createdAt: null,
    updatedAt: null,
    metadata: {}
  };

  constructor(
    private route: ActivatedRoute,
    private router: Router,
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
        packaging: new FormControl([], [Validators.required]),
        application: new FormControl([], [Validators.required]),
        application_type: new FormControl([], [Validators.required]),
        other_application_type: new FormControl(''),
        estimated_application_type: new FormControl([]),
        other_estimated_application_type: new FormControl(''),
      }),
      // Product's fields
      product_section: new FormGroup({
        product_family: new FormControl([], [Validators.required]),
        product: new FormControl([], [Validators.required]),
        film_grade: new FormControl([]),
        thickness: new FormControl([], [Validators.required]),
        manufacturing_technique: new FormControl(''),
      }),
      // AdditionalFeatures's fields
      additional_features_section: new FormArray([]),
      // Dimensions's fields
      dimensions_section: new FormGroup({
        width: new FormControl(null),
        height: new FormControl(null),
        flap: new FormControl(null),
        closed_gusset: new FormControl(null),
        core: new FormControl([]),
        reel_length_limitation: new FormControl(''),
        box_weight_limitation: new FormControl(''),
        od: new FormControl(RFQ.nameNA),
        reel_weight_limitation: new FormControl(''),
        cof: new FormControl([]),
      }),
      // Graphics's fields
      graphics_section: new FormGroup({
        printing: new FormControl(false),
        digital_printing: new FormControl(false),
        number_of_colors: new FormControl([]),
        rtf: new FormControl(''),
        external_logo: new FormArray([]),
      }),
      // Pricing's fields
      pricing_section: new FormGroup({
        currency: new FormControl((this.priceCurrencyList.length) ? this.priceCurrencyList[0] : ''), // 'EUR' by default
        shipping_terms: new FormControl((this.shippingTermsList.length) ? [this.shippingTermsList[0]] : [], [Validators.required]), // ['EXW'] by default
        pricing_measure_unit: new FormControl([], [Validators.required]),
        imp_width: new FormControl(null),
        imp_height: new FormControl(null),
        moq: new FormControl(''),
        annual_quantity_potential: new FormControl(''),
        current_material_used: new FormControl(''),
        current_price_payed: new FormControl(null),
        items: new FormArray([
          new FormGroup({
            quantity: new FormControl(null, [Validators.required]),
            price_per_unit: new FormControl(''),
            price_total: new FormControl(''),
            eur_cost: new FormControl(null),
            usd_cost: new FormControl(null),
            convertor_cost_eur: new FormControl(null),
            convertor_cost_usd: new FormControl(null),
            eur_price: new FormControl(null),
            moq_unit: new FormControl(null),
            moq_meter: new FormControl(null),
            moq_kg: new FormControl(null),
            moq_impression: new FormControl(null),
            usd_price: new FormControl(null),
            total_eur_price: new FormControl(null),
            total_usd_price: new FormControl(null),
            private_quantity_note: new FormControl(''),
          }),
        ]),
        remarks: new FormControl(''),
      }),
      // Other's fields
      other_section: new FormGroup({
        rfq_is_for: new FormControl(this.rfqIsFor.commercialOrder || ''),
      }),
    });
  }

  ngOnInit(): void {
    this.getQueryParams();

    this.multiSubscription = forkJoin([this.getCategories(), this.getApplications(), this.getProducts()]).subscribe((res) => {
      // Initial data
      this.getInitialFormMode();
      this.getDigitalPrinting();

      // PRESELECT RfqForm
      this.getRfq();
    }, (err) => {
      this.alertService.showError('');
    });

    this.getSegmentSection.valueChanges
      .pipe(distinctUntilChanged((x, y) => JSON.stringify(x) === JSON.stringify(y)))
      .subscribe(() => {
        this.resetPricingSectionItems(); // IMPORTANT
      });

    this.getApplicationSection.valueChanges
      .pipe(distinctUntilChanged((x, y) => JSON.stringify(x) === JSON.stringify(y)))
      .subscribe(res => {
        this.getFilteredApplications();
        this.getProductsLists();
        this.resetPricingSectionItems(); // IMPORTANT
      });

    this.getProductSection.valueChanges
      .pipe(distinctUntilChanged((x, y) => JSON.stringify(x) === JSON.stringify(y)))
      .subscribe(res => {
        this.getFilteredApplications();
        this.resetPricingSectionItems(); // IMPORTANT
      });

    this.getDimensionsSection.valueChanges
      .pipe(distinctUntilChanged((x, y) => JSON.stringify(x) === JSON.stringify(y)))
      .subscribe(() => {
        this.resetPricingSectionItems(); // IMPORTANT
      });

    this.getGraphicsSection.valueChanges
      .pipe(distinctUntilChanged((x, y) => JSON.stringify(x) === JSON.stringify(y)))
      .subscribe(() => {
        this.resetPricingSectionItems(); // IMPORTANT
      });

    this.getSegmentSection.get('segment').valueChanges.subscribe((value: CategoryModel[]) => {
      // Set categories to segmentTypeList
      this.segmentTypeList = [];
      if (value && value.length) {
        const copySegmentSelected = this.multiSelectService
          .transformSelectData(_.cloneDeep(value))
          .filter(id => id);
        this.segmentTypeList = this.multiSelectService.getDropdownByArray(this.categories, copySegmentSelected);
      }
      this.segmentTypeList.push(this.otherCategory);

      // RESET segment_type field
      this.resetSegmentTypeField();
    });

    this.getSegmentSection.get('segment_type').valueChanges.subscribe((value: CategoryModel[]) => {
      // Set categories to packetGoodsList
      this.packetGoodsList = [];
      let segmentTypeIsOther: boolean = this.getControlSelectedOtherCategory(this.getSegmentSection.get('segment_type').value);
      // IMPORTANT segment_type should be NOT other category
      // because id can be not correct
      if (!segmentTypeIsOther && value && value.length) {
        const copySegmentTypeSelected = this.multiSelectService
          .transformSelectData(_.cloneDeep(value))
          .filter(id => id);
        this.packetGoodsList = this.multiSelectService.getDropdownByArray(this.categories, copySegmentTypeSelected);
      }
      this.packetGoodsList.push(this.otherCategory);

      // GET data
      this.getSelectedProductInfo();

      // RESETS
      this.resetPackedGoodsField();
    });

    this.getSegmentSection.get('packed_goods').valueChanges.subscribe((value: CategoryModel[]) => {
      this.getFilmGrade();
      this.getPackedGoodsFeedback();
      this.getApplicationsTypeFeedback();
      this.getProductInfoFeedback();
    });

    this.getApplicationSection.get('packaging').valueChanges.subscribe((value: CategoryModel[]) => {
      // Set categories to applicationList
      this.applicationList = [];
      if (value && value.length) {
        const copyApplicationSelected = this.multiSelectService
          .transformSelectData(_.cloneDeep(value))
          .filter(id => id);
        this.applicationList = this.multiSelectService.getDropdownByArray(this.categories, copyApplicationSelected);
      }

      // GET data
      this.getFilteredPricingMeasureUnitList();
      this.getRequiredReelLengthWeight();
      this.getRequiredReelOd();

      // RESETS
      this.resetApplicationField();
    });

    this.getApplicationSection.get('application').valueChanges.subscribe((value: CategoryModel[]) => {
      this.getApplicationsTypeList();
      this.getEstimatedApplicationType();
      this.getDigitalPrinting();

      // RESET
      this.resetEstimatedApplicationTypeField();
    });

    this.getApplicationSection.get('application_type').valueChanges
    .pipe(distinctUntilChanged((x, y) => JSON.stringify(x) === JSON.stringify(y)))
    .subscribe((value: CategoryModel[]) => {
      this.getApplicationsTypeList();
      this.getEstimatedApplicationType();
      this.getNumberOfColors();
    });

    this.getApplicationSection.get('estimated_application_type').valueChanges.subscribe((value: CategoryModel[]) => {
      this.estimatedApplicationTypeIsOther = this.getControlSelectedOtherCategory(this.getApplicationSection.get('estimated_application_type').value);
      this.getNumberOfColors();
    });

    this.getProductSection.get('product_family').valueChanges.subscribe(value => {
      this.getProductsLists();
    });

    this.getProductSection.get('product').valueChanges.subscribe(value => {
      this.autoSelectProductFamily();
      this.getProductsLists();
      this.getSelectedProductInfo();
    });

    this.getProductSection.get('thickness').valueChanges.subscribe((value: CategoryModel[]) => {
      this.getSelectedThickness();
      this.getDigitalPrinting();
    });

    this.getAdditionalFeaturesSection.valueChanges
      .pipe(distinctUntilChanged((x, y) => JSON.stringify(x) === JSON.stringify(y)))
      .subscribe(value => {
        this.resetPricingSectionItems(); // IMPORTANT
        this.getAdditionalFeaturesFeedback();
        this.getIsVisibleFlapField();
        this.getIsVisibleGussetField();

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
      });

    this.getDimensionsSection.get('width').valueChanges.subscribe((value: any) => {
      this.getWidthFeedback();
    });

    this.getDimensionsSection.get('height').valueChanges.subscribe((value: any) => {
      this.getHeightFeedback();
    });

    this.getDimensionsSection.get('flap').valueChanges
      .pipe(distinctUntilChanged((x, y) => JSON.stringify(x) === JSON.stringify(y)))
      .subscribe((value: any) => {
        this.getHeightFeedback();
      });

    this.getDimensionsSection.get('core').valueChanges.subscribe((value: any) => {
      this.getCoreFeedback();
    });

    this.getDimensionsSection.get('reel_length_limitation').valueChanges
      .pipe(distinctUntilChanged((x, y) => JSON.stringify(x) === JSON.stringify(y)))
      .subscribe((value: any) => {
        this.getRequiredReelLengthWeight();
      });

    this.getDimensionsSection.get('reel_weight_limitation').valueChanges
      .pipe(distinctUntilChanged((x, y) => JSON.stringify(x) === JSON.stringify(y)))
      .subscribe((value: any) => {
        this.getRequiredReelLengthWeight();
      });

    this.getGraphicsSection.get('printing').valueChanges
      .pipe(distinctUntilChanged((x, y) => JSON.stringify(x) === JSON.stringify(y)))
      .subscribe((value: any) => {
        this.getPrinting();
        this.getDigitalPrinting();

        // are visible external_logo and rtf
        let printingValue = this.getGraphicsSection.get('printing').value;
        this.externalLogoIsVisible = (printingValue) ? true : false;
      });

    this.getGraphicsSection.get('digital_printing').valueChanges
      .pipe(distinctUntilChanged((x, y) => JSON.stringify(x) === JSON.stringify(y)))
      .subscribe((value: any) => {
        this.getDigitalPrinting();
      });

    this.getOtherSection.get('rfq_is_for').valueChanges
      .pipe(distinctUntilChanged((x, y) => JSON.stringify(x) === JSON.stringify(y)))
      .subscribe(() => {
        this.resetPricingSectionItems(); // IMPORTANT
      });

    this.getPricingSection.get('currency').valueChanges
      .pipe(distinctUntilChanged((x, y) => JSON.stringify(x) === JSON.stringify(y)))
      .subscribe((value: any) => {
        this.resetPricingSectionItems(); // IMPORTANT
      });

    this.getPricingSection.get('pricing_measure_unit').valueChanges.subscribe((value: any) => {
      this.getPricingMeasureUnitFields();
      this.resetPricingSectionItems(); // IMPORTANT
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
    if (this.opportunitySubscription) {
      this.opportunitySubscription.unsubscribe();
    }
    if (this.rfqSubscription) {
      this.rfqSubscription.unsubscribe();
    }
    if (this.multiSubscription) {
      this.multiSubscription.unsubscribe();
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

  get getGraphicsSectionExternalLogo(): FormArray {
    return this.getGraphicsSection.get('external_logo') as FormArray;
  }

  get getPricingSectionItems(): FormArray {
    return this.getPricingSection.get('items') as FormArray;
  }

  get getOtherSection(): FormGroup {
    return this.rfqForm.get('other_section') as FormGroup;
  }

  resetPricingSectionItems() {
    // RESET data when the user changes any field above price items

    // RESET pricing_section -> moq field
    let moqControl = this.getPricingSection.get('moq');
    let moqValue: string = (moqControl) ? moqControl.value : '';
    if (moqControl && moqValue) {
      moqControl.setValue('', {emitEvent: false});
    }

    // RESET pricing_section -> items field
    if (this.getPricingSectionItems) {
      this.getPricingSectionItems.controls.map(item => {
        let itemControl = item as FormGroup;
        if (!itemControl) { return false; }

        Object.keys(itemControl.controls).forEach(key => {
          if (key !== 'quantity') { // IMPORTANT - without quantity control
            itemControl.get(key).setValue(null, {emitEvent: false});
          }
        });
      });
    }
  }

  resetSegmentTypeField() {
    let RESET: boolean = false;
    let selectedSegmentType: CategoryModel = this.getDataSingleSelect(this.getSegmentSection.get('segment_type').value);

    if (selectedSegmentType) {
      let selectedSegment: CategoryModel = this.getDataSingleSelect(this.getSegmentSection.get('segment').value);

      if (selectedSegment) {
        let found = this.segmentTypeList.find(item => item.id === selectedSegmentType.id);
        if (!found) {
          RESET = true;
        }
      } else {
        RESET = true;
      }
    }

    if (RESET) {
      this.getSegmentSection.get('segment_type').setValue([], {emitEvent: false});
      this.getSegmentSection.get('segment_type').markAsPristine();
    }
  }

  resetPackedGoodsField() {
    let RESET: boolean = false;
    let selectedPackedGoods: CategoryModel = this.getDataSingleSelect(this.getSegmentSection.get('packed_goods').value);

    if (selectedPackedGoods) {
      let selectedSegmentType: CategoryModel = this.getDataSingleSelect(this.getSegmentSection.get('segment_type').value);

      if (selectedSegmentType) {
        let found = this.packetGoodsList.find(item => item.id === selectedPackedGoods.id);
        if (!found) {
          RESET = true;
        }
      } else {
        RESET = true;
      }
    }

    if (RESET) {
      this.getSegmentSection.get('packed_goods').setValue([], {emitEvent: false});
      this.getSegmentSection.get('packed_goods').markAsPristine();
    }
  }

  resetApplicationField() {
    let RESET: boolean = false;
    let selectedApplication: CategoryModel = this.getDataSingleSelect(this.getApplicationSection.get('application').value);

    if (selectedApplication) {
      let selectedPackaging: CategoryModel = this.getDataSingleSelect(this.getApplicationSection.get('packaging').value);

      if (selectedPackaging) {
        let found = this.applicationList.find(item => item.id === selectedApplication.id);
        if (!found) {
          RESET = true;
        }
      } else {
        RESET = true;
      }
    }

    if (RESET) {
      this.getApplicationSection.get('application').setValue([], {emitEvent: false});
      this.getApplicationSection.get('application').markAsPristine();
    }
  }

  resetProductFamilyField() {
    let RESET: boolean = false;
    let selectedProductFamily: CategoryModel = this.getDataSingleSelect(this.getProductSection.get('product_family').value);

    if (selectedProductFamily) {
      let selectedPackaging: CategoryModel = this.getDataSingleSelect(this.getApplicationSection.get('packaging').value);

      if (selectedPackaging) {
        let found = this.productFamilyList.find(item => item.id === selectedProductFamily.id);
        if (!found) {
          RESET = true;
        }
      } else {
        RESET = true;
      }
    }

    if (RESET) {
      this.getProductSection.get('product_family').setValue([], {emitEvent: false});
      this.getProductSection.get('product_family').markAsPristine();
    }
  }

  resetApplicationTypeField() {
    let RESET: boolean = false;
    let selectedApplicationType: CategoryModel = this.getDataSingleSelect(this.getApplicationSection.get('application_type').value);

    if (selectedApplicationType) {
      let selectedApplication: CategoryModel = this.getDataSingleSelect(this.getApplicationSection.get('application').value);

      if (selectedApplication) {
        let found = this.applicationTypeList.find(item => item.id === selectedApplicationType.id);
        if (!found) {
          RESET = true;
        }
      } else {
        RESET = true;
      }
    }

    if (RESET) {
      this.getApplicationSection.get('application_type').setValue([], {emitEvent: false});
      this.getApplicationSection.get('application_type').markAsPristine();
    }
  }

  resetEstimatedApplicationTypeField() {
    let RESET: boolean = false;
    let selectedEstimatedApplicationType: CategoryModel = this.getDataSingleSelect(this.getApplicationSection.get('estimated_application_type').value);

    if (selectedEstimatedApplicationType) {
      let selectedApplication: CategoryModel = this.getDataSingleSelect(this.getApplicationSection.get('application').value);

      if (selectedApplication) {
        let found = this.estimatedApplicationTypeList.find(item => item.id === selectedEstimatedApplicationType.id);
        if (!found) {
          RESET = true;
        }
      } else {
        RESET = true;
      }
    }

    if (RESET) {
      this.getApplicationSection.get('estimated_application_type').setValue([], {emitEvent: false});
      this.getApplicationSection.get('estimated_application_type').markAsPristine();
    }
  }

  resetProductField() {
    let RESET: boolean = false;
    let selectedProduct: CategoryModel = this.getDataSingleSelect(this.getProductSection.get('product').value);

    if (selectedProduct) {
      let selectedProductFamily: CategoryModel = this.getDataSingleSelect(this.getProductSection.get('product_family').value);

      if (selectedProductFamily) {
        let found = this.productList.find(item => item.id === selectedProduct.id);
        if (!found) {
          RESET = true;
        }
      } else {
        RESET = true;
      }
    }

    if (RESET) {
      this.getProductSection.get('product').setValue([], {emitEvent: false});
      this.getProductSection.get('product').markAsPristine();
    }
  }

  resetThickness() {
    let RESET: boolean = false;
    let selectedThickness: ThicknessItem = this.getDataSingleSelect(this.getProductSection.get('thickness').value);

    if (selectedThickness) {
      let found = this.thicknessList.find(item => item.id === selectedThickness.id); // id is unique
      if (!found) {
        RESET = true;
      }
    }

    if (RESET) {
      this.getProductSection.get('thickness').setValue([], {emitEvent: false});
      this.getProductSection.get('thickness').markAsPristine();
    }
  }

  resetPricingMeasureUnitField() {
    let RESET: boolean = false;
    let selectedPricingMeasureUnit: CategoryModel = this.getDataSingleSelect(this.getPricingSection.get('pricing_measure_unit').value);

    if (selectedPricingMeasureUnit) {
      let found = this.pricingMeasureUnitList.find(item => item.id === selectedPricingMeasureUnit.id);
      if (!found) {
        RESET = true;
      }
    }

    if (RESET) {
      this.getPricingSection.get('pricing_measure_unit').setValue([], {emitEvent: false});
      this.getPricingSection.get('pricing_measure_unit').markAsPristine();
    }
  }

  resetNumberOfColorsField() {
    let RESET: boolean = false;
    let selectedNumberOfColors: number = this.getDataSingleSelect(this.getGraphicsSection.get('number_of_colors').value);

    if (selectedNumberOfColors) {
      let found = this.numberOfColorsList.find(item => item === selectedNumberOfColors);
      if (!found) {
        RESET = true;
      }
    }

    if (RESET) {
      this.getGraphicsSection.get('number_of_colors').setValue([], {emitEvent: false});
      this.getGraphicsSection.get('number_of_colors').markAsPristine();
    }
  }

  getQueryParams(): void {
    this.route.queryParams.subscribe(params => {
      this.isRedirectedFromZoho = params.zoho && (params.zoho === 'true');
      this.opportunityId = params.opportunity_id;
      this.userId = (params && params.user_id) ? String(params.user_id) : '';
      this.rfqId = (params && params.rfq_id) ? String(params.rfq_id) : '';
      this.action = (params && params.action) ? String(params.action) : '';
      this.currency = params.currency;

      if (this.currency && this.priceCurrencyList.length) {
        let foundCurrency = this.priceCurrencyList.find(item => item.includes(this.currency));
        this.getPricingSection.get('currency').setValue((foundCurrency) ? foundCurrency : this.priceCurrencyList[0]);
      }

      if (!this.isRedirectedFromZoho || !this.opportunityId) {
        this.navigateToMainPage();
      }

      this.getOpportunity();
    });
  }

  getOpportunity(): void {
    this.opportunitySubscription = this.quoteRequestService.getOpportunity(this.opportunityId).subscribe(
      (res: OpportunitySection) => {
        this.opportunitySection = {
          ...res,
          user_id: (this.userId) ? String(this.userId) : '',
        };
      },
      (err: HttpErrorResponse) => {
        this.opportunitySection = {
          id: '',
          accountName: '',
          name: '',
          owner: '',
          user_id: '',
        };
        this.alertService.showError(err.error.message);
      }
    );
  }

  getCategories() {
    return new Observable((observer) => {
      this.categoriesSubscription = this.categoryService.getCategories()
        .subscribe((categories: CategoryModel[]) => {
          this.categories = categories;

          // GET segmentList
          const SEGMENTS = AppConstants.MainCategoryNames.SEGMENTS;
          let segmentListParent = this.categories
            .find((category) => (category.title === SEGMENTS.title && category.level === SEGMENTS.level) );
          if (segmentListParent) {
            this.segmentList = this.multiSelectService.getDropdownById(categories, segmentListParent.id);
          }

          // GET packagingList
          const APPLICATION = AppConstants.MainCategoryNames.APPLICATION;
          let packagingListParent = this.categories
            .find((category) => (category.title === APPLICATION.title && category.level === APPLICATION.level) );
          if (packagingListParent) {
            this.packagingList = this.multiSelectService.getDropdownById(categories, packagingListParent.id);
          }

          // GET applicationTypeList
          const APPLICATION_TYPE = AppConstants.MainCategoryNames.APPLICATION_TYPE;
          let applicationTypeListParent = this.categories
            .find((category) => (category.title === APPLICATION_TYPE.title && category.level === APPLICATION_TYPE.level) );
          if (applicationTypeListParent) {
            this.allApplicationTypeList = this.multiSelectService.getDropdownById(categories, applicationTypeListParent.id);
          }

          // GET productFamilyList
          const PRODUCT_FAMILY = AppConstants.MainCategoryNames.PRODUCT_FAMILY;
          let productFamilyListParent = this.categories
            .find((category) => (category.title === PRODUCT_FAMILY.title && category.level === PRODUCT_FAMILY.level) );
          if (productFamilyListParent) {
            this.allProductFamilyList = this.multiSelectService.getDropdownById(categories, productFamilyListParent.id);
          }

          // GET coreList
          const CORE = AppConstants.MainCategoryNames.CORE;
          let coreListParent = this.categories
            .find((category) => (category.title === CORE.title && category.level === CORE.level) );
          if (coreListParent) {
            // sorting by title
            let coreCopyList: any[] = JSON.parse(JSON.stringify(this.multiSelectService.getDropdownById(categories, coreListParent.id)));
            coreCopyList = coreCopyList.map(item => {
              item.title = Number(item.title); // should be number for sorting
              return item;
            });
            coreCopyList = _.orderBy(coreCopyList, ['title'], ['asc']); // sorting
            coreCopyList = coreCopyList.map(item => {
              item.title = String(item.title); // return to string
              return item;
            });

            this.coreList = coreCopyList;
          }

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
      // GET applications and associated applications
      // ONLY for RFQ form
      let dataParams: GetApplicationsParamsModel = {
        associated: true,
        rfq_page: true,
      };

      this.applicationsSubscription = this.applicationService.getApplications(dataParams).subscribe(
        (res) => {
          this.applications = res;
          this.filteredApplications = res;

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

  getRfq() {
    if (!this.rfqId) { return false; }

    this.rfqSubscription = this.quoteRequestService.getRfq(this.rfqId).subscribe(
      (res: RfqModel) => {
        let rfqData: RfqModel = (res) ? res : null;
        this.preselectRfqForm(rfqData);
      },
      (err: HttpErrorResponse) => {
        this.alertService.showError(err.error.message);
      }
    );
  }

  preselectRfqForm(data: RfqModel) {
    if (!data) { return false; }

    // PRESELECT Custom rfqForm, only when (type is missing from the data) or (type = custom)
    let rfqFormType: string = data.type;
    if ((!rfqFormType) || (rfqFormType && rfqFormType === AppConstants.RfqFormTypeNames.CUSTOM)) { // Custom item, with preselect Custom rfqForm on the Custom tab
      // go to Custom tab as default
      (this.staticTabs.tabs[1]) ? (this.staticTabs.tabs[1].active = true) : false;
    } else { // Fast Track item, without preselect Custom rfqForm on the Custom tab
      // go to Fast Track tab as default
      (this.staticTabs.tabs[0]) ? (this.staticTabs.tabs[0].active = true) : false;
      return false;
    }

    let subscription = new Observable((observer) => {
      // form_mode
      let formMode = () => {
        let formModeValue: number = (data.form_mode) ? data.form_mode : null;

        if (formModeValue) {
          let formModeItem: RfqFormModeModel = this.formModeList.find(item => item.id === formModeValue);

          if (formModeItem) {
            this.toggleFormMode(formModeItem);
          } else {
            this.getInitialFormMode();
          }
        }
      }
      formMode();

      /********************
        other_section
      ********************/
      // rfq_is_for
      let rfqIsFor = () => {
        let rfqIsForValue: string = (data.other_section && data.other_section.rfq_is_for) ? data.other_section.rfq_is_for : '';
        let rfqIsForItem: string = this.rfqIsFor.commercialOrder; // commercialOrder by default

        Object.entries(this.rfqIsFor).forEach(entry => {
          const [key, value] = entry;

          if (rfqIsForValue === value) {
            rfqIsForItem = value;
          }
        });

        this.getOtherSection.get('rfq_is_for').setValue(rfqIsForItem);
      }
      rfqIsFor();

      /********************
        segment_section
      ********************/
      // segment
      let segment = () => {
        let segmentValue: RfqShortItemModel = (data.segment_section && data.segment_section.segment) ? data.segment_section.segment : null;

        if (segmentValue) {
          let segmentItem: CategoryModel = this.segmentList.find(item => item.id === segmentValue.id);

          if (segmentItem) {
            this.getSegmentSection.get('segment').setValue([segmentItem]);
          } else {
            observer.next('Segment');
          }
        }
      }
      segment();

      // segment_type
      let segmentType = () => {
        let segmentTypeControl = this.getSegmentSection.get('segment_type');
        let segmentTypeValue: RfqShortItemModel = (data.segment_section && data.segment_section.segment_type) ? data.segment_section.segment_type : null;

        if (segmentTypeValue) {
          let segmentTypeItem: CategoryModel = this.segmentTypeList.find(item => item.id === segmentTypeValue.id);

          if (segmentTypeItem) {
            segmentTypeControl.setValue([segmentTypeItem]);

            // other_segment_type
            if (this.getControlSelectedOtherCategory(segmentTypeControl.value)) {
              this.getSegmentSection.get('other_segment_type').setValue(segmentTypeValue.title);
            }
          } else {
            observer.next('Sub Segment');
          }
        }
      }
      segmentType();

      // packed_goods
      let packedGoods = () => {
        let packedGoodsControl = this.getSegmentSection.get('packed_goods');
        let packedGoodsValue: RfqShortItemModel = (data.segment_section && data.segment_section.packed_goods) ? data.segment_section.packed_goods : null;

        if (packedGoodsValue) {
          let packedGoodsItem: CategoryModel = this.packetGoodsList.find(item => item.id === packedGoodsValue.id);

          if (packedGoodsItem) {
            packedGoodsControl.setValue([packedGoodsItem]);

            // other_packed_goods
            if (this.getControlSelectedOtherCategory(packedGoodsControl.value)) {
              this.getSegmentSection.get('other_packed_goods').setValue(packedGoodsValue.title);
            }
          } else {
            observer.next('Packed Goods Type');
          }
        }
      }
      packedGoods();

      // expected_shelf_life
      let expectedShelfLife = () => {
        let expectedShelfLifeControl = this.getSegmentSection.get('expected_shelf_life');
        let expectedShelfLifeValue: string = (data.segment_section && data.segment_section.expected_shelf_life) ? data.segment_section.expected_shelf_life : '';
        expectedShelfLifeControl.setValue(expectedShelfLifeValue);
      }
      expectedShelfLife();

      /********************
        application_section
      ********************/
      // packaging
      let packaging = () => {
        let packagingControl = this.getApplicationSection.get('packaging');
        let packagingValue: RfqShortItemModel = (data.application_section && data.application_section.packaging) ? data.application_section.packaging : null;

        if (packagingValue) {
          let packagingItem: CategoryModel = this.packagingList.find(item => item.id === packagingValue.id);

          if (packagingItem) {
            packagingControl.setValue([packagingItem]);
          } else {
            observer.next('Packaging / Reel');
          }
        }
      }
      packaging();

      // application
      let application = () => {
        let applicationControl = this.getApplicationSection.get('application');
        let applicationValue: RfqShortItemModel = (data.application_section && data.application_section.application) ? data.application_section.application : null;

        if (applicationValue) {
          let applicationItem: CategoryModel = this.applicationList.find(item => item.id === applicationValue.id);

          if (applicationItem) {
            applicationControl.setValue([applicationItem]);
          } else {
            observer.next('Application');
          }
        }
      }
      application();

      // application_type
      let applicationType = () => {
        let applicationTypeControl = this.getApplicationSection.get('application_type');
        let applicationTypeValue: RfqShortItemModel = (data.application_section && data.application_section.application_type) ? data.application_section.application_type : null;

        if (applicationTypeValue) {
          let applicationTypeItem: CategoryModel = this.applicationTypeList.find(item => item.id === applicationTypeValue.id);

          if (applicationTypeItem) {
            applicationTypeControl.setValue([applicationTypeItem]);

            // other_application_type
            if (this.getControlSelectedOtherCategory(applicationTypeControl.value)) {
              this.getApplicationSection.get('other_application_type').setValue(applicationTypeValue.title);
            }
          } else {
            observer.next('Application Type');
          }
        }
      }
      applicationType();

      // estimated_application_type
      let estimatedApplicationType = () => {
        let estimatedApplicationTypeControl = this.getApplicationSection.get('estimated_application_type');
        let estimatedApplicationTypeValue: RfqShortItemModel = (data.application_section && data.application_section.estimated_application_type) ? data.application_section.estimated_application_type : null;

        if (estimatedApplicationTypeValue) {
          let estimatedApplicationTypeItem: CategoryModel = this.estimatedApplicationTypeList.find(item => item.id === estimatedApplicationTypeValue.id);

          if (estimatedApplicationTypeItem) {
            estimatedApplicationTypeControl.setValue([estimatedApplicationTypeItem]);

            // other_estimated_application_type
            if (this.getControlSelectedOtherCategory(estimatedApplicationTypeControl.value)) {
              this.getApplicationSection.get('other_estimated_application_type').setValue(estimatedApplicationTypeValue.title);
            }
          } else {
            observer.next('Estimated Application Type');
          }
        }
      }
      estimatedApplicationType();

      /********************
        product_section
      ********************/
      // product_family
      let productFamily = () => {
        let productFamilyControl = this.getProductSection.get('product_family');
        let productFamilyValue: RfqShortItemModel = (data.product_section && data.product_section.product_family) ? data.product_section.product_family : null;

        if (productFamilyValue) {
          let productFamilyItem: CategoryModel = this.productFamilyList.find(item => item.id === productFamilyValue.id);

          if (productFamilyItem) {
            productFamilyControl.setValue([productFamilyItem]);
          } else {
            observer.next('Product family');
          }
        }
      }
      productFamily();

      // product
      let product = () => {
        let productControl = this.getProductSection.get('product');
        let productValue: RfqShortItemModel = (data.product_section && data.product_section.product) ? data.product_section.product : null;

        if (productValue) {
          let productItem = this.productList.find(item => item.id === productValue.id);

          if (productItem) {
            productControl.setValue([productItem]);
          } else {
            observer.next('Product');
          }
        }
      }
      product();

      // thickness
      let thickness = () => {
        let thicknessControl = this.getProductSection.get('thickness');
        let thicknessValue: number = (data.product_section && data.product_section.thickness) ? data.product_section.thickness : null;

        if (thicknessValue) {
          let thicknessItem: ThicknessItem = this.thicknessList.find(item => item.title === thicknessValue);

          if (thicknessItem) {
            thicknessControl.setValue([thicknessItem]);
          } else {
            observer.next('Thickness');
          }
        }
      }
      thickness();

      /********************
        additional_features_section
      ********************/
      // additional_features
      let additionalFeatures = () => {
        let additionalFeaturesValue: any[] = (data.additional_features_section) ? data.additional_features_section : [];

        if (additionalFeaturesValue && Array.isArray(additionalFeaturesValue)) {
          this.getAdditionalFeatures(additionalFeaturesValue);
        } else {
          this.getAdditionalFeatures();
        }
      }
      additionalFeatures();

      /********************
        dimensions_section
      ********************/
      // width
      let width = () => {
        let widthControl = this.getDimensionsSection.get('width');
        let widthValue: number = (data.dimensions_section && data.dimensions_section.width) ? data.dimensions_section.width : null;
        widthControl.setValue(widthValue);
      }
      width();

      // height
      let height = () => {
        let heightControl = this.getDimensionsSection.get('height');
        let heightValue: number = (data.dimensions_section && data.dimensions_section.height) ? data.dimensions_section.height : null;
        heightControl.setValue(heightValue);
      }
      height();

      // flap
      let flap = () => {
        let flapControl = this.getDimensionsSection.get('flap');
        let flapValue: number = (data.dimensions_section && data.dimensions_section.flap) ? data.dimensions_section.flap : null;
        flapControl.setValue(flapValue);
      }
      flap();

      // closed_gusset
      let closedGusset = () => {
        let closedGussetControl = this.getDimensionsSection.get('closed_gusset');
        let closedGussetValue: number = (data.dimensions_section && data.dimensions_section.closed_gusset) ? data.dimensions_section.closed_gusset : null;
        closedGussetControl.setValue(closedGussetValue);
      }
      closedGusset();

      // core
      let core = () => {
        let coreControl = this.getDimensionsSection.get('core');
        let coreValue: RfqShortItemModel = (data.dimensions_section && data.dimensions_section.core) ? data.dimensions_section.core : null;

        if (coreValue) {
          let coreItem: CategoryModel = this.coreList.find(item => item.id === coreValue.id);

          if (coreItem) {
            coreControl.setValue([coreItem]);
          } else {
            observer.next('Core');
          }
        }
      }
      core();

      // reel_length_limitation
      let reelLengthLimitation = () => {
        let reelLengthLimitationControl = this.getDimensionsSection.get('reel_length_limitation');
        let reelLengthLimitationValue: string = (data.dimensions_section && data.dimensions_section.reel_length_limitation) ? data.dimensions_section.reel_length_limitation : '';
        reelLengthLimitationControl.setValue(reelLengthLimitationValue);
      }
      reelLengthLimitation();

      // box_weight_limitation
      let boxWeightLimitation = () => {
        let boxWeightLimitationControl = this.getDimensionsSection.get('box_weight_limitation');
        let boxWeightLimitationValue: string = (data.dimensions_section && data.dimensions_section.box_weight_limitation) ? data.dimensions_section.box_weight_limitation : '';
        boxWeightLimitationControl.setValue(boxWeightLimitationValue);
      }
      boxWeightLimitation();

      // od
      let od = () => {
        let odControl = this.getDimensionsSection.get('od');
        let odValue: string = (data.dimensions_section && data.dimensions_section.od) ? data.dimensions_section.od : RFQ.nameNA;
        odControl.setValue(odValue);
      }
      od();

      // reel_weight_limitation
      let reelWeightLimitation = () => {
        let reelWeightLimitationControl = this.getDimensionsSection.get('reel_weight_limitation');
        let reelWeightLimitationValue: string = (data.dimensions_section && data.dimensions_section.reel_weight_limitation) ? data.dimensions_section.reel_weight_limitation : '';
        reelWeightLimitationControl.setValue(reelWeightLimitationValue);
      }
      reelWeightLimitation();

      // cof
      let cof = () => {
        let cofControl = this.getDimensionsSection.get('cof');
        let cofValue: number = (data.dimensions_section && data.dimensions_section.cof) ? data.dimensions_section.cof : null;

        if (cofValue) {
          let cofItem: CofModel = this.cofList.find(item => item.title === cofValue);

          if (cofItem) {
            cofControl.setValue([cofItem]);
          } else {
            observer.next('COF');
          }
        }
      }
      cof();

      /********************
        graphics_section
      ********************/
      // printing
      let printing = () => {
        let printingControl = this.getGraphicsSection.get('printing');
        let printingValue: boolean = (data.graphics_section && data.graphics_section.printing) ? data.graphics_section.printing : false;
        printingControl.setValue(printingValue);
      }
      printing();

      // digital_printing
      let digitalPrinting = () => {
        let digitalPrintingControl = this.getGraphicsSection.get('digital_printing');
        let digitalPrintingValue: boolean = (data.graphics_section && data.graphics_section.digital_printing) ? data.graphics_section.digital_printing : false;
        digitalPrintingControl.setValue(digitalPrintingValue);
      }
      digitalPrinting();

      // number_of_colors
      let numberOfColors = () => {
        let numberOfColorsControl = this.getGraphicsSection.get('number_of_colors');
        let numberOfColorsValue: number = (data.graphics_section && data.graphics_section.number_of_colors) ? data.graphics_section.number_of_colors : null;

        if (numberOfColorsValue) {
          let numberOfColorsItem: number = this.numberOfColorsList.find(item => item === numberOfColorsValue);

          if (numberOfColorsItem) {
            numberOfColorsControl.setValue([numberOfColorsItem]);
          } else {
            observer.next('Number of colors');
          }
        }
      }
      numberOfColors();

      // rtf and external_logo
      let rtfAndExternalLogo = () => {
        let externalLogoValue: GraphicsSectionExternalLogo[] = (data.graphics_section && data.graphics_section.external_logo) ? data.graphics_section.external_logo : [];

        if (externalLogoValue && Array.isArray(externalLogoValue)) {
          this.getCertifications(externalLogoValue);
        } else {
          this.getCertifications();
        }
      }
      rtfAndExternalLogo();

      /********************
        pricing_section
      ********************/
      // currency
      let currency = () => {
        let currencyControl = this.getPricingSection.get('currency');
        let currencyValue: string = (data.pricing_section && data.pricing_section.currency) ? data.pricing_section.currency : '';

        if (currencyValue) {
          let currencyItem: string = this.priceCurrencyList.find(item => item === currencyValue);

          if (currencyItem) {
            currencyControl.setValue(currencyItem);
          } else {
            observer.next('Currency');
          }
        }
      }
      currency();

      // pricing_measure_unit
      let pricingMeasureUnit = () => {
        let pricingMeasureUnitControl = this.getPricingSection.get('pricing_measure_unit');
        let pricingMeasureUnitValue: string = (data.pricing_section && data.pricing_section.pricing_measure_unit) ? data.pricing_section.pricing_measure_unit : '';

        if (pricingMeasureUnitValue) {
          let pricingMeasureUnitItem: PricingMeasureUnit = this.pricingMeasureUnitList.find(item => String(item.title).toLowerCase() === String(pricingMeasureUnitValue).toLowerCase());

          if (pricingMeasureUnitItem) {
            pricingMeasureUnitControl.setValue([pricingMeasureUnitItem]);
          } else {
            observer.next('Pricing measure unit');
          }
        }
      }
      pricingMeasureUnit();

      // imp_width
      let impWidth = () => {
        let impWidthControl = this.getPricingSection.get('imp_width');
        let impWidthValue: number = (data.pricing_section && data.pricing_section.imp_width) ? data.pricing_section.imp_width : null;
        impWidthControl.setValue(impWidthValue);
      }
      impWidth();

      // imp_height
      let impHeight = () => {
        let impHeightControl = this.getPricingSection.get('imp_height');
        let impHeightValue: number = (data.pricing_section && data.pricing_section.imp_height) ? data.pricing_section.imp_height : null;
        impHeightControl.setValue(impHeightValue);
      }
      impHeight();

      // annual_quantity_potential
      let annualQuantityPotential = () => {
        let annualQuantityPotentialControl = this.getPricingSection.get('annual_quantity_potential');
        let annualQuantityPotentialValue: string = (data.pricing_section && data.pricing_section.annual_quantity_potential) ? data.pricing_section.annual_quantity_potential : '';
        annualQuantityPotentialControl.setValue(annualQuantityPotentialValue);
      }
      annualQuantityPotential();

      // current_material_used
      let currentMaterialUsed = () => {
        let currentMaterialUsedControl = this.getPricingSection.get('current_material_used');
        let currentMaterialUsedValue: string = (data.pricing_section && data.pricing_section.current_material_used) ? data.pricing_section.current_material_used : '';
        currentMaterialUsedControl.setValue(currentMaterialUsedValue);
      }
      currentMaterialUsed();

      // current_price_payed
      let currentPricePayed = () => {
        let currentPricePayedControl = this.getPricingSection.get('current_price_payed');
        let currentPricePayedValue: number = (data.pricing_section && data.pricing_section.current_price_payed) ? data.pricing_section.current_price_payed : null;
        currentPricePayedControl.setValue(currentPricePayedValue);
      }
      currentPricePayed();

      // remarks
      let remarks = () => {
        let remarksControl = this.getPricingSection.get('remarks');
        let remarksValue: string = (data.pricing_section && data.pricing_section.remarks) ? data.pricing_section.remarks : '';
        remarksControl.setValue(remarksValue);
      }
      remarks();


      observer.complete();
    }).subscribe(
      (fieldLabel: string) => {
        let errorMessage: string = `We could not fill the ${fieldLabel}`;
        this.alertService.showError(errorMessage);
      },
      (error: string) => {
        this.alertService.showError(error);
      }
    ).unsubscribe();
  }

  getFilteredApplications() {
    this.filteredApplications = JSON.parse(JSON.stringify(this.applications));

    // when NOT a "Reel"
    // if "Reel" is selected, we shouldn't filtering by these fields
    if (!this.getIsReel()) {
      // Filtering applications by Packaging/Reel
      let selectedPackaging = this.getDataSingleSelect(this.getApplicationSection.get('packaging').value);
      let packOrReelApplicationList: CategoryModel[] = (selectedPackaging)
        ? this.multiSelectService.getDropdownByArray(this.categories, [selectedPackaging.id])
        : [];
      if (selectedPackaging && packOrReelApplicationList.length) {
        this.filteredApplications = this.filteredApplications.filter(item => {
          return (item.application && item.application.length)
            ? packOrReelApplicationList.find(category => category.id === item.application[0])
            : null;
        });
      }

      // Filtering applications by application
      let selectedApplication = this.getDataSingleSelect(this.getApplicationSection.get('application').value);
      if (selectedApplication) {
        this.filteredApplications = this.filteredApplications.filter(item => {
          let found = (item.application && item.application.length)
            ? item.application[0] === selectedApplication.id
            : null;
          return found;
        });
      }
    }

    // Filtering applications by application_type
    let selectedApplicationType = this.getDataSingleSelect(this.getApplicationSection.get('application_type').value);
    if (selectedApplicationType) {
      if (this.getControlSelectedConvertingCategory(selectedApplicationType)) { // application_type is "converting"
        let selectedEstimatedApplicationType = this.getDataSingleSelect(this.getApplicationSection.get('estimated_application_type').value);
        if (selectedEstimatedApplicationType) {
          this.filteredApplications = this.filteredApplications.filter(item => item.type === selectedEstimatedApplicationType.id );
        }
      } else {
        this.filteredApplications = this.filteredApplications.filter(item => item.type === selectedApplicationType.id );
      }
    }

    // Filtering applications by product and product_family
    let selectedProductFamily = this.getDataSingleSelect(this.getProductSection.get('product_family').value);
    let selectedProduct = this.getDataSingleSelect(this.getProductSection.get('product').value);
    this.filteredApplications = this.filteredApplications.filter(item => {
      let productObj = this.products.find(product => product.id === item.product[0]);

      if (!productObj) { return false; }

      let foundProductFamily: boolean = true;
      if (selectedProductFamily) {
        foundProductFamily = (productObj.family[0] === selectedProductFamily.id);
      }

      let foundProduct: boolean = true;
      if (selectedProduct) {
        foundProduct = (productObj.id === selectedProduct.id);
      }

      return (foundProductFamily && foundProduct);
    });

    // GET filtered application info
    this.getFilteredApplicationInfo();
  }

  getSelectedProductInfo() {
    let productInfo: ProductModel = this.getDataSingleSelect(this.getProductSection.get('product').value);
    if (productInfo) {
      this.selectedProductInfo = this.products.find(product => product.id === productInfo.id);
    } else {
      this.selectedProductInfo = null;
    }

    // GET fields data
    this.getProductInfoFeedback();
    this.getManufacturingTechnique();
    this.getCertifications();
    this.getWidth();
    this.getPrinting();
  }

  getFilteredApplicationInfo() {
    let selectedApplicationType = this.getDataSingleSelect(this.getApplicationSection.get('application_type').value);
    let applicationTypeIsOther: boolean = this.getControlSelectedOtherCategory(this.getApplicationSection.get('application_type').value);
    let applicationTypeIsNA: boolean = this.getControlSelectedNACategory(selectedApplicationType);
    let applicationTypeIsConverting: boolean = this.getControlSelectedConvertingCategory(selectedApplicationType);

    let selectedEstimatedApplicationType = this.getDataSingleSelect(this.getApplicationSection.get('estimated_application_type').value);
    let estimatedApplicationTypeIsOther: boolean = this.getControlSelectedOtherCategory(this.getApplicationSection.get('estimated_application_type').value);
    let estimatedApplicationTypeIsNA: boolean = this.getControlSelectedNACategory(selectedEstimatedApplicationType);

    let selectedProduct: CategoryModel = this.getDataSingleSelect(this.getProductSection.get('product').value);
    let newFilteredApplicationInfo: boolean = true;
    let canGetInfo: boolean = false;
    this.similarApplications = false;

    if (selectedApplicationType && !applicationTypeIsOther && !applicationTypeIsNA) {
      if (applicationTypeIsConverting) { // Converting Application
        canGetInfo = (selectedProduct && selectedEstimatedApplicationType && !estimatedApplicationTypeIsOther && !estimatedApplicationTypeIsNA);
      } else { // Application
        if (selectedProduct) { // with product
          canGetInfo = true;
        } else if (!selectedProduct && this.filteredApplications.length === 1) { // one application
          canGetInfo = true;
        } else if (!selectedProduct && this.filteredApplications.length > 1) { // Similar applications. Need product
          this.similarApplications = true;
        }
      }
    }

    if (canGetInfo) {
      let found = (this.filteredApplicationInfo)
        ? this.filteredApplications.find(item => item.id === this.filteredApplicationInfo.id)
        : null;

      if (this.filteredApplicationInfo && found && this.filteredApplicationInfo.id === found.id) {
        newFilteredApplicationInfo = false;
      } else {
        this.filteredApplicationInfo = this.getDataSingleSelect(this.filteredApplications);
        newFilteredApplicationInfo = true;
      }
    } else {
      this.filteredApplicationInfo = null;
      newFilteredApplicationInfo = true;
    }

    if (newFilteredApplicationInfo) {
      // GET fields data
      this.getApplicationsTypeFeedback();
      this.getProductInfoFeedback();
      this.getThickness();
      this.getAdditionalFeatures();
      this.getWidth();
      this.getHeight();
      this.getCertifications();
    }
  }

  getApplicationsTypeList() {
    this.applicationTypeList = [];
    let selectedApplication: CategoryModel = this.getDataSingleSelect(this.getApplicationSection.get('application').value);

    if (selectedApplication) {
      // Filtering applications by application
      let applicationsByApplication: ApplicationModel[] = JSON.parse(JSON.stringify(this.applications)).filter(item => {
        return (item.application && item.application.length)
          ? item.application[0] === selectedApplication.id
          : null;
      });

      // SET applications type
      let applicationTypeIds: number[] = applicationsByApplication.map(item => item.type);
      applicationTypeIds = _.uniq(applicationTypeIds);
      this.applicationTypeList = applicationTypeIds
        .map(id => this.categories.find(category => category.id === id) )
        .filter(item => (item) ? item : false);

      // ADD N/A and converting categories, when 'Reel' is selected
      if (this.getIsReel()) {
        this.applicationTypeList = [this.naCategory, ...this.applicationTypeList, this.convertingCategory];
      }

      // ADD other category
      this.applicationTypeList.push(this.otherCategory);
    }

    // GET data
    this.autoSelectApplicationType();

    // RESET
    this.resetApplicationTypeField();
  }

  autoSelectApplicationType() {
    this.applicationTypeIsDisabled = false;
    let selectedApplication: CategoryModel = this.getDataSingleSelect(this.getApplicationSection.get('application').value);

    // Autoselect "converting" category, when "Reel" is selected
    if (this.getIsReel() && selectedApplication) {
      this.getApplicationSection.get('application_type').setValue([this.convertingCategory], {emitEvent: false});
      this.applicationTypeIsDisabled = true;
    }
  }

  getApplicationsTypeFeedback() {
    let selectedApplicationType: CategoryModel = this.getDataSingleSelect(this.getApplicationSection.get('application_type').value);
    let selectedPackedGoods: CategoryModel = this.getDataSingleSelect(this.getSegmentSection.get('packed_goods').value);
    // Reset by default
    this.applicationTypeStageInfo = null;
    this.applicationTypeIsCommercial = false;
    this.applicationTypeIsUnderDev = false;
    this.applicationTypeNotMatchPackedGoods = false;

    if (selectedApplicationType &&
      !this.getControlSelectedNACategory(selectedApplicationType) &&
      !this.getControlSelectedConvertingCategory(selectedApplicationType) &&
      !this.getControlSelectedOtherCategory([selectedApplicationType])
      ) { // if application_type is selected
      if (this.filteredApplicationInfo) { // selected application info
        // Stage of Application type
        this.applicationTypeStageInfo = (this.filteredApplicationInfo.stage)
          ? this.stageList.find(item => item.id === this.filteredApplicationInfo.stage)
          : null;
        this.applicationTypeIsCommercial = (this.filteredApplicationInfo.stage && this.getIsStageCommercial(this.filteredApplicationInfo.stage))
          ? true
          : false;
        this.applicationTypeIsUnderDev = (this.filteredApplicationInfo.stage && this.getIsStageUnderDev(this.filteredApplicationInfo.stage))
          ? true
          : false;

        // Application type and Packed goods
        if (selectedPackedGoods) {
          let found = (Array.isArray(this.filteredApplicationInfo.packed_goods))
            ? this.filteredApplicationInfo.packed_goods.find(id => id === selectedPackedGoods.id)
            : null;

          this.applicationTypeNotMatchPackedGoods = (!found) ? true : false; // not matched
        }
      } else { // all possible applications
        if (this.filteredApplications.length) {
          let filteredApplicationsIssues = this.filteredApplications.map(item => {
            // Stage
            let isUnderDev: boolean = (item && item.stage && this.getIsStageUnderDev(item.stage));

            // PackedGoods
            let foundMatchPackedGoods;
            let notMatchPackedGoods: boolean = false; // by default
            if (selectedPackedGoods) {
              foundMatchPackedGoods = (Array.isArray(item.packed_goods))
                ? item.packed_goods.find(id => id === selectedPackedGoods.id)
                : null;
            }
            notMatchPackedGoods = (selectedPackedGoods)
              ? (!foundMatchPackedGoods) ? true : false
              : false;

            return {
              isUnderDev,
              notMatchPackedGoods,
              hasIssues: (isUnderDev || notMatchPackedGoods),
            };
          });

          let hasNotIssues: boolean = !!(filteredApplicationsIssues.find(item => (!item.hasIssues))); // Application doesn't have issues
          if (hasNotIssues) { // one application of application without issues
            // Stage
            this.applicationTypeStageInfo = this.stageList.find(item => item.id === this.stageItemIds.COMMERCIAL);
            this.applicationTypeIsCommercial = true;
            this.applicationTypeIsUnderDev = false;
            // PackedGoods
            this.applicationTypeNotMatchPackedGoods = false;
          } else {
            // Stage
            this.applicationTypeStageInfo = this.stageList.find(item => item.id === this.stageItemIds.UNDER_DEVELOPMENT);
            this.applicationTypeIsCommercial = false;
            this.applicationTypeIsUnderDev = true;
            // PackedGoods
            // All Equal --> if all applications have issue with PackedGoods
            this.applicationTypeNotMatchPackedGoods = filteredApplicationsIssues.every( (item, i, arr) => (item.notMatchPackedGoods === true) && (item.notMatchPackedGoods === arr[0].notMatchPackedGoods) );
          }
        }
      }
    }

    // SET Feedback for application type
    this.setFeedbackSectionChildProperty(this.feedbackSection.production.applTypeIsUnderDev , this.applicationTypeIsUnderDev);
    this.setFeedbackSectionChildProperty(this.feedbackSection.packed_goods.applTypeNotMatchPackedGoods, this.applicationTypeNotMatchPackedGoods);
  }

  getEstimatedApplicationType() {
    let selectedApplication: CategoryModel = this.getDataSingleSelect(this.getApplicationSection.get('application').value);
    let selectedApplicationType = this.getDataSingleSelect(this.getApplicationSection.get('application_type').value);

    // by default
    this.estimatedApplicationTypeList = []; // [] by default
    let copyApplications: ApplicationModel[] = JSON.parse(JSON.stringify(this.applications)); // COPY

    // GET all merged application categories
    let allApplicationList: CategoryModel[] = [];
    let parentAndNestedList = this.packagingList
      .map(itemParent => {
        let nestedList = this.multiSelectService.getDropdownById(this.categories, itemParent.id);

        if (Array.isArray(nestedList)) {
          allApplicationList.push(...nestedList);
        }

        return nestedList;
      });

    if (selectedApplication && selectedApplicationType && this.getControlSelectedConvertingCategory(selectedApplicationType)) {
      // estimated_application_type field
      this.estimatedApplicationTypeIsVisible = true;
      this.getApplicationSection.get('estimated_application_type').setValidators([Validators.required]);
      this.getApplicationSection.get('estimated_application_type').updateValueAndValidity();

      // Filtering applications by application
      if (this.getApplicationIsReelFilm()) { // Application is "ReelFilm"
        let reelFilm: CategoryModel = allApplicationList.find(item => this.getApplicationIsReelFilm(item));
        let bagFilm: CategoryModel = allApplicationList.find(item => this.getApplicationIsBagFilm(item));

        if (reelFilm && bagFilm) { // reelFilm + bagFilm categories
          copyApplications = copyApplications.filter(item => {
            return (item.application && item.application.length)
              ? (item.application[0] === reelFilm.id) || (item.application[0] === bagFilm.id)
              : null;
          });
        }
      } else if (this.getApplicationIsReelLaminate()) { // Application is "ReelLaminate"
        let reelLaminate: CategoryModel = allApplicationList.find(item => this.getApplicationIsReelLaminate(item));
        let pouchLaminate: CategoryModel = allApplicationList.find(item => this.getApplicationIsPouchLaminate(item));

        if (reelLaminate && pouchLaminate) { // reelLaminate + pouchLaminate categories
          copyApplications = copyApplications.filter(item => {
            return (item.application && item.application.length)
              ? (item.application[0] === reelLaminate.id) || (item.application[0] === pouchLaminate.id)
              : null;
          });
        }
      } else { // Selected Application
        copyApplications = copyApplications.filter(item => {
          return (item.application && item.application.length)
            ? item.application[0] === selectedApplication.id
            : null;
        });
      }

      // SET applications type
      let applicationTypeIds: number[] = copyApplications.map(item => item.type);
      applicationTypeIds = _.uniq(applicationTypeIds);
      this.estimatedApplicationTypeList = applicationTypeIds
        .map(id => this.categories.find(category => category.id === id) )
        .filter(item => (item) ? item : false);

      // ADD N/A and other categories
      this.estimatedApplicationTypeList = [this.naCategory, ...this.estimatedApplicationTypeList, this.otherCategory];
    } else {
      // estimated_application_type field
      this.estimatedApplicationTypeIsVisible = false;
      this.getApplicationSection.get('estimated_application_type').setValue([], {emitEvent: false});
      this.getApplicationSection.get('estimated_application_type').clearValidators();
      this.getApplicationSection.get('estimated_application_type').updateValueAndValidity();
    }
  }

  getProductsLists() {
    this.productFamilyList = [];
    this.productList = [];
    let selectedProductFamily = this.getDataSingleSelect(this.getProductSection.get('product_family').value);
    let selectedApplication = this.getDataSingleSelect(this.getApplicationSection.get('application').value);
    let selectedApplicationType = this.getDataSingleSelect(this.getApplicationSection.get('application_type').value);
    this.productAndFamilyIsVisible = false;

    if (selectedApplication && selectedApplicationType) {
      // Filtering applications by application
      let applicationsByApplication: ApplicationModel[] = JSON.parse(JSON.stringify(this.applications)).filter(item => {
        return (item.application && item.application.length)
          ? item.application[0] === selectedApplication.id
          : null;
      });

      // Filtering applications by application_type
      if (this.getIsPackaging() && selectedApplicationType) { // with application_type, if application_type is not Other category
        this.productAndFamilyIsVisible = true;

        // selected application_type is not Other category
        if (!this.getControlSelectedOtherCategory(this.getApplicationSection.get('application_type').value)) {
          applicationsByApplication = applicationsByApplication.filter(item => item.type === selectedApplicationType.id );
        }
      } else if (this.getIsReel()) { // without the application_type
        this.productAndFamilyIsVisible = true;
      }

      // Filtering products based on filtered applications
      this.productList = applicationsByApplication.map(application => {
        return (application.product.length)
          ? this.products.find(product => product.id === application.product[0])
          : null;
      }).filter(product => (product) ? product : false);

      this.productList = _.uniqBy(this.productList, product => product.id);

      // Product family based on products
      this.productFamilyList = this.productList.map(product => {
        return this.allProductFamilyList.find(category => category.id === product.family[0]);
      }).filter(product => (product) ? product : false);

      this.productFamilyList = _.uniqBy(this.productFamilyList, product => product.id);

      // Filtering products by product family
      if (selectedProductFamily) {
        this.productList = this.productList.filter(product => {
          return (product.family.length)
            ? product.family[0] === selectedProductFamily.id
            : null;
        });
      }
    }

    // RESETS
    this.resetProductFamilyField();
    this.resetProductField();
  }

  getTmpItemProduct(itemId: number) {
    return this.productList.find(item => item.id === itemId);
  }

  autoSelectProductFamily() {
    let selectedProductFamily = this.getDataSingleSelect(this.getProductSection.get('product_family').value);
    let selectedProduct = this.getDataSingleSelect(this.getProductSection.get('product').value);

    if (selectedProduct && !selectedProductFamily) {
      let foundProductInfo: ProductModel = this.productList.find(item => item.id === selectedProduct.id);

      if (foundProductInfo) {
        let foundProductFamilyInfo: CategoryModel = this.productFamilyList.find(item => {
          return (foundProductInfo.family && foundProductInfo.family.length)
            ? item.id === foundProductInfo.family[0]
            : null;
        });

        if (foundProductFamilyInfo) {
          this.getProductSection.get('product_family').setValue([foundProductFamilyInfo]);
        }
      }
    }
  }

  getProductInfoFeedback() {
    let selectedSegmentType: CategoryModel = this.getDataSingleSelect(this.getSegmentSection.get('segment_type').value);
    let selectedPackedGoods: CategoryModel = this.getDataSingleSelect(this.getSegmentSection.get('packed_goods').value);
    // Reset by default
    this.productStageInfo = null;
    this.productIsCommercial = false;
    this.productIsUnderDev = false;
    // this.productNotMatchSegmentType = false;
    this.productNotMatchPackedGoods = false;

    if (this.selectedProductInfo) {
      // product stage
      this.productStageInfo = (this.selectedProductInfo.stage)
        ? this.stageList.find(item => item.id === this.selectedProductInfo.stage)
        : null;
      this.productIsCommercial = (this.selectedProductInfo.stage && this.getIsStageCommercial(this.selectedProductInfo.stage))
        ? true
        : false;
      this.productIsUnderDev = (this.selectedProductInfo.stage && this.getIsStageUnderDev(this.selectedProductInfo.stage))
        ? true
        : false;

      // product segment_type
      // if (selectedSegmentType) {
      //   let found = (Array.isArray(this.selectedProductInfo.segment_type))
      //     ? this.selectedProductInfo.segment_type.find(id => id === selectedSegmentType.id)
      //     : null;

      //   if (!found) { this.productNotMatchSegmentType = true; } // NOT match
      // }

      // product packed_goods
      if (selectedPackedGoods) {
        let packedGoodsList: number[] = [];

        // when 'Packaging'
        if (this.getIsPackaging() && this.filteredApplicationInfo) { // from application
          packedGoodsList = (Array.isArray(this.filteredApplicationInfo.packed_goods))
            ? this.filteredApplicationInfo.packed_goods
            : [];
        }

        // when 'Rell'
        if (this.getIsReel()) {
          if (this.filteredApplicationInfo) { // from application
            packedGoodsList = (Array.isArray(this.filteredApplicationInfo.packed_goods))
              ? this.filteredApplicationInfo.packed_goods
              : [];
          } else if (this.selectedProductInfo) { // from product
            packedGoodsList = (Array.isArray(this.selectedProductInfo.packed_goods))
              ? this.selectedProductInfo.packed_goods
              : [];
          }
        }

        let found = (Array.isArray(packedGoodsList))
          ? packedGoodsList.find(id => id === selectedPackedGoods.id)
          : null;

        this.productNotMatchPackedGoods = (!found) ? true : false; // not matched
      }
    }

    // SET Feedback for product
    this.setFeedbackSectionChildProperty(this.feedbackSection.production.productIsUnderDev, this.productIsUnderDev);
    // this.setFeedbackSectionChildProperty(this.feedbackSection.packed_goods.productNotMatchSegmentType, this.productNotMatchSegmentType);
    this.setFeedbackSectionChildProperty(this.feedbackSection.packed_goods.productNotMatchPackedGoods, this.productNotMatchPackedGoods);
  }

  getThickness() {
    this.thicknessList = [];
    let thickness: any[] = [];
    let selectedApplicationType = this.getDataSingleSelect(this.getApplicationSection.get('application_type').value);
    let applicationTypeIsOther: boolean = this.getControlSelectedOtherCategory(this.getApplicationSection.get('application_type').value);

    if (this.getIsPackaging() && selectedApplicationType && !applicationTypeIsOther) { // thickness from Application
      thickness = (this.filteredApplicationInfo && this.filteredApplicationInfo.thickness && this.filteredApplicationInfo.thickness.length)
        ? this.filteredApplicationInfo.thickness
        : [];
    } else { // thickness from Product or converting application
      if (this.getControlSelectedConvertingCategory(selectedApplicationType) && this.filteredApplicationInfo) { // from converting application
        thickness = (this.filteredApplicationInfo && this.filteredApplicationInfo.thickness && this.filteredApplicationInfo.thickness.length)
          ? this.filteredApplicationInfo.thickness
          : [];
      } else { // from Product
        thickness = (this.selectedProductInfo && this.selectedProductInfo.thickness && this.selectedProductInfo.thickness.length)
          ? this.selectedProductInfo.thickness
          : [];
      }
    }

    if (thickness && thickness.length) {
      thickness.map(item => {
        item.values.map(value => {
          let stageItem = AppConstants.StageItemList.find(stageItem => stageItem.id === item.stage);

          let obj: ThicknessItem = {
            id: `${item.stage} ${value} ${(stageItem) ? stageItem.title : ''}`, // id is unique
            title: Number(value),
            stage: item.stage,
            isCommercial: this.getIsStageCommercial(item.stage),
            isUnderDev: this.getIsStageUnderDev(item.stage),
          };

          if (typeof obj.title === 'number') {
            this.thicknessList.push(obj);
          }
        });
      });

      this.thicknessList = _.uniqWith(this.thicknessList, _.isEqual); // id is unique
      this.thicknessList = _.orderBy(this.thicknessList, ['title', 'stage'], ['asc', 'asc']);
    }

    // RESET
    this.resetThickness();
  }

  getTmpItemThickness(itemId: string) {
    return this.thicknessList.find(item => item.id === itemId);
  }

  getSelectedThickness() {
    let selectedThickness = this.getDataSingleSelect(this.getProductSection.get('thickness').value);
    this.selectedThickness = (selectedThickness)
      ? this.thicknessList.find(item => item.id === selectedThickness.id)
      : null;

    // SET Feedback for thickness
    (this.selectedThickness && this.getIsStageUnderDev(this.selectedThickness.stage))
      ? this.setFeedbackSectionChildProperty(this.feedbackSection.production.thicknessIsNotSK, true)
      : this.setFeedbackSectionChildProperty(this.feedbackSection.production.thicknessIsNotSK, false);
  }

  getAdditionalFeatures(preselectAFList?: RfqModelAdditionalFeaturesSection[]) {
    let additionalFeaturesSection: RfqFormModelAdditionalFeaturesSection[] = [];
    let additionalFeaturesList: RfqFormModelAdditionalFeature[] = [];

    while (this.getAdditionalFeaturesSection.length !== 0) {
      this.getAdditionalFeaturesSection.removeAt(0);
    }

    // GET additional_features form product or application
    let basicList: AdditionalFeaturesModel[] = [];
    if (this.getIsReel() && this.selectedProductInfo) { // when "Reel" - take from the product
      basicList = (this.selectedProductInfo.additional_features && Array.isArray(this.selectedProductInfo.additional_features))
        ? this.selectedProductInfo.additional_features
        : [];
    } else if (this.getIsPackaging() && this.filteredApplicationInfo) { // when "Packaging" - take from the application
      basicList = (this.filteredApplicationInfo.additional_features && Array.isArray(this.filteredApplicationInfo.additional_features))
        ? this.filteredApplicationInfo.additional_features
        : [];
    } else {
      basicList = [];
    }

    // additional_features are empty
    if (!Array.isArray(basicList) || !basicList.length) {
      return false;
    }

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

    // additionalFeaturesList = _.uniqWith(additionalFeaturesList, _.isEqual); // Unique features

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
            // find pre item
            let foundPreAFItem: RfqModelAdditionalFeaturesSection = (preselectAFList && Array.isArray(preselectAFList))
              ? preselectAFList.find(preItem => ( (preItem && preItem.id) && (itemFeature && itemFeature.id) && (preItem.id === itemFeature.id) ))
              : null;

            // mandatory
            let mandatoryValue: boolean = itemFeature.mandatory;

            // selected
            let selectedValue: boolean = (mandatoryValue) ? !!(mandatoryValue) : !!(foundPreAFItem);

            return new FormGroup({
              stage: new FormControl(itemFeature.stage),
              mandatory: new FormControl(mandatoryValue),
              selected: new FormControl({value: selectedValue, disabled: mandatoryValue}),
              id: new FormControl(itemFeature.id),
              additional_feature: new FormControl(itemFeature.additional_feature),
              additional_feature_parent: new FormControl(itemFeature.additional_feature_parent),
              additional_feature_hints: new FormArray([
                ...itemFeature.additional_feature_hints.map(featureHint => {
                  // find pre hint item
                  let foundHintItem = (foundPreAFItem && foundPreAFItem.additional_feature_hints && Array.isArray(foundPreAFItem.additional_feature_hints))
                    ? foundPreAFItem.additional_feature_hints.find(preHintItem => preHintItem.hint_name === featureHint.hint_name)
                    : null;

                  // hint_value
                  let hintValue: string = (foundHintItem && foundHintItem.hint_value) ? foundHintItem.hint_value : featureHint.hint_value;

                  return new FormGroup({
                    hint_name: new FormControl(featureHint.hint_name),
                    hint_value: new FormControl(hintValue),
                  });
                })
              ]),
            });
          })
        ]),
      }));
    });
  }

  getAdditionalFeaturesFeedback() {
    let additionalFeaturesSection: RfqFormModelAdditionalFeaturesSection[] = this.getAdditionalFeaturesSection.value;

    let foundFeatureUnderDev: boolean = !!additionalFeaturesSection.find(item => (
      item.list.find(itemFeature => (itemFeature.mandatory || itemFeature.selected) && this.getIsStageUnderDev(itemFeature.stage))
    ));

    this.setFeedbackSectionChildProperty(this.feedbackSection.production.addFeatureIsNotSK, foundFeatureUnderDev);
  }

  getWidth() {
    this.width = null;
    let comList: any[] = [];
    let underDevList: any[] = [];
    let futureDevList: any[] = [];

    if (this.getIsPackaging()) {
      comList = (this.filteredApplicationInfo && this.filteredApplicationInfo.width && this.filteredApplicationInfo.width.length)
        ? this.filteredApplicationInfo.width.filter(item => this.getIsStageCommercial(item.stage))
        : [];
      underDevList = (this.filteredApplicationInfo && this.filteredApplicationInfo.width && this.filteredApplicationInfo.width.length)
        ? this.filteredApplicationInfo.width.filter(item => this.getIsStageUnderDev(item.stage))
        : [];
      futureDevList = (this.filteredApplicationInfo && this.filteredApplicationInfo.width && this.filteredApplicationInfo.width.length)
        ? this.filteredApplicationInfo.width.filter(item => (item && item.stage === this.stageItemIds.FUTURE_DEVELOPMENT))
        : [];
    } else if (this.getIsReel()) {
      comList = (this.selectedProductInfo && this.selectedProductInfo.width && this.selectedProductInfo.width.length)
        ? this.selectedProductInfo.width.filter(item => this.getIsStageCommercial(item.stage))
        : [];
      underDevList = (this.selectedProductInfo && this.selectedProductInfo.width && this.selectedProductInfo.width.length)
        ? this.selectedProductInfo.width.filter(item => this.getIsStageUnderDev(item.stage))
        : [];
      futureDevList = (this.selectedProductInfo && this.selectedProductInfo.width && this.selectedProductInfo.width.length)
        ? this.selectedProductInfo.width.filter(item => (item && item.stage === this.stageItemIds.FUTURE_DEVELOPMENT))
        : [];
    }

    if ((comList && comList.length) || (underDevList && underDevList.length) || (futureDevList && futureDevList.length)) {
      this.width = {
        commer: null,
        underDev: null,
        futureDev: null,
      };

      if (comList && comList.length) { // comercial values
        let min = Math.min(...comList.map(item => item.min));
        min = (typeof min === 'number') ? min : 0;
        let max = Math.max(...comList.map(item => item.max));
        max = (typeof max === 'number') ? max : 0;
        let stage = this.stageItemIds.COMMERCIAL;
        let placeholder = `${min}min-${max}max`;

        this.width.commer = { min, max, stage, placeholder, };
      }

      if (underDevList && underDevList.length) { // underDev values
        let min = Math.min(...underDevList.map(item => item.min));
        min = (typeof min === 'number') ? min : 0;
        let max = Math.max(...underDevList.map(item => item.max));
        max = (typeof max === 'number') ? max : 0;
        let stage = this.stageItemIds.UNDER_DEVELOPMENT;
        let placeholder = `${min}min-${max}max`;

        this.width.underDev = { min, max, stage, placeholder, };
      }

      if (futureDevList && futureDevList.length) { // futureDev values
        let min = Math.min(...futureDevList.map(item => item.min));
        min = (typeof min === 'number') ? min : 0;
        let max = Math.max(...futureDevList.map(item => item.max));
        max = (typeof max === 'number') ? max : 0;
        let stage = this.stageItemIds.FUTURE_DEVELOPMENT;
        let placeholder = `${min}min-${max}max`;

        this.width.futureDev = { min, max, stage, placeholder, };
      }
    }

    // GET data
    this.getWidthFeedback();
  }

  getWidthFeedback() {
    let valueWidth = this.getDimensionsSection.get('width').value;
    this.widthIsCommercial = false; // false by default
    this.widthIsUnderDev = false; // false by default

    if (this.getTypeofIsNumber(valueWidth)) {
      if (this.width && this.width.commer && (+valueWidth >= this.width.commer.min && +valueWidth <= this.width.commer.max)) {
        this.widthIsCommercial = true;
      } else {
        if (this.width && (!this.width.commer && !this.width.underDev) && this.width.futureDev) { // when futureDev is present
          this.widthIsUnderDev = false;
        } else {
          this.widthIsUnderDev = true;
        }
      }
    }

    // SET Feedback for Width
    this.setFeedbackSectionChildProperty(this.feedbackSection.production.widthIsNotSK, this.widthIsUnderDev);
  }

  getHeight() {
    this.height = null;

    if (this.filteredApplicationInfo && this.filteredApplicationInfo.height && this.filteredApplicationInfo.height.length) {
      let comList = this.filteredApplicationInfo.height.filter(item => this.getIsStageCommercial(item.stage));
      let underDevList: any[] = this.filteredApplicationInfo.height.filter(item => this.getIsStageUnderDev(item.stage));
      let futureDevList: any[] = this.filteredApplicationInfo.height.filter(item => (item && item.stage === this.stageItemIds.FUTURE_DEVELOPMENT));

      this.height = {
        commer: null,
        underDev: null,
        futureDev: null,
      };

      if (comList && comList.length) { // comercial values
        let min = Math.min(...comList.map(item => item.min));
        min = (typeof min === 'number') ? min : 0;
        let max = Math.max(...comList.map(item => item.max));
        max = (typeof max === 'number') ? max : 0;
        let stage = this.stageItemIds.COMMERCIAL;
        let placeholder = `${min}min-${max}max`;
        this.height.commer = { min, max, stage, placeholder, };
      }

      if (underDevList && underDevList.length) { // underDev values
        let min = Math.min(...underDevList.map(item => item.min));
        min = (typeof min === 'number') ? min : 0;
        let max = Math.max(...underDevList.map(item => item.max));
        max = (typeof max === 'number') ? max : 0;
        let stage = this.stageItemIds.UNDER_DEVELOPMENT;
        let placeholder = `${min}min-${max}max`;
        this.height.underDev = { min, max, stage, placeholder, };
      }

      if (futureDevList && futureDevList.length) { // futureDev values
        let min = Math.min(...futureDevList.map(item => item.min));
        min = (typeof min === 'number') ? min : 0;
        let max = Math.max(...futureDevList.map(item => item.max));
        max = (typeof max === 'number') ? max : 0;
        let stage = this.stageItemIds.FUTURE_DEVELOPMENT;
        let placeholder = `${min}min-${max}max`;
        this.height.futureDev = { min, max, stage, placeholder, };
      }
    }

    // GET data
    this.getHeightFeedback();
  }

  getHeightFeedback() {
    let valueHeight = this.getDimensionsSection.get('height').value;
    let valueFlap = this.getDimensionsSection.get('flap').value;
    this.heightIsCommercial = false; // false by default
    this.heightIsUnderDev = false; // false by default
    this.heightPlusFlapIsMoreMaxHeight = false; // false by default

    // when Packaging is selected and height has value
    if (this.getIsPackaging() && this.getTypeofIsNumber(valueHeight)) {
      // stage and note for height
      if (this.height && this.height.commer && (+valueHeight >= this.height.commer.min && +valueHeight <= this.height.commer.max)) {
        this.heightIsCommercial = true;
      } else {
        if (this.height && (!this.height.commer && !this.height.underDev) && this.height.futureDev) { // when futureDev is present
          this.heightIsUnderDev = false;
        } else {
          this.heightIsUnderDev = true;
        }
      }

      // note (height + flap) for height
      this.heightPlusFlapIsMoreMaxHeight = (this.height && this.height.commer) && ((+valueHeight) + (+valueFlap)) > this.height.commer.max;
    }

    // SET Feedback for Height
    this.setFeedbackSectionChildProperty(this.feedbackSection.production.heightIsNotSK, this.heightIsUnderDev);
    this.setFeedbackSectionChildProperty(this.feedbackSection.production.heightPlusFlapIsMoreMaxHeight, this.heightPlusFlapIsMoreMaxHeight);
  }

  getCoreFeedback() {
    let selectedCore = this.getDataSingleSelect(this.getDimensionsSection.get('core').value);
    // false by default
    this.coreIsCommercial = false;
    this.coreIsUnderDev = false;

    if (selectedCore) {
      if (selectedCore.title === '3' || selectedCore.title === 3) {
        this.coreIsCommercial = false;
        this.coreIsUnderDev = true;
      } else {
        this.coreIsCommercial = true;
        this.coreIsUnderDev = false;
      }
    }

    // SET Feedback for core
    this.setFeedbackSectionChildProperty(this.feedbackSection.production.coreIsUnderDev , this.coreIsUnderDev);
  }

  getPackedGoodsFeedback() {
    let selectedPackedGoods: CategoryModel = this.getDataSingleSelect(this.getSegmentSection.get('packed_goods').value);

    this.packedGoodsIsOther = (selectedPackedGoods && this.getControlSelectedOtherCategory([selectedPackedGoods]))
      ? true
      : false;

    this.setFeedbackSectionChildProperty(this.feedbackSection.packed_goods.newPackedGoods, this.packedGoodsIsOther);
  }

  getManufacturingTechnique() {
    let foundItem = (this.selectedProductInfo && this.selectedProductInfo.manufacturing_technique)
      ? this.manufacturingTechniqueList.find(item => item.id === this.selectedProductInfo.manufacturing_technique)
      : null;
    let value: string = (this.selectedProductInfo)
      ? (foundItem) ? foundItem.title : RFQ.nameNA
      : '';
    this.getProductSection.get('manufacturing_technique').setValue(value);
  }

  getFilmGrade() {
    let selectedPackedGoods: CategoryModel = this.getDataSingleSelect(this.getSegmentSection.get('packed_goods').value);
    let foundPackedGoods: CategoryModel = (selectedPackedGoods)
      ? this.packetGoodsList.find(item => item.id === selectedPackedGoods.id)
      : null;
    let foundFilmGrade: FilmGradeModel = (foundPackedGoods && foundPackedGoods.metadata && foundPackedGoods.metadata.hasOwnProperty('film_grade'))
      ? this.filmGradeList.find(item => item.id === foundPackedGoods.metadata.film_grade)
      : null;
    this.getProductSection.get('film_grade').setValue((foundFilmGrade) ? [foundFilmGrade] : [], {emitEvent: false});
  }

  getRequiredReelOd() {
    if (this.getIsReel()) {
      this.getDimensionsSection.get('od').setValidators([Validators.required]);
      this.getDimensionsSection.get('od').updateValueAndValidity();
    } else {
      this.getDimensionsSection.get('od').clearValidators();
      this.getDimensionsSection.get('od').updateValueAndValidity();
    }
  }

  getRequiredReelLengthWeight() {
    let reelLengthValue = this.getDimensionsSection.get('reel_length_limitation').value;
    let reelWeightValue = this.getDimensionsSection.get('reel_weight_limitation').value;

    // false by default
    let reelLengthIsRequired: boolean = false;
    let reelWeightIsRequired: boolean = false;

    // when Reel, 1 of 2 fields should be required
    if (this.getIsReel() && (!reelLengthValue && !reelWeightValue)) {
      reelLengthIsRequired = true;
      reelWeightIsRequired = true;
    }

    const updateDimensionsSectionControl = (controlName: string, required: boolean) => {
      let control = this.getDimensionsSection.get(controlName);
      if (!control) { return false; }

      if (required) {
        control.setValidators([Validators.required]);
        control.updateValueAndValidity();
      } else {
        control.clearValidators();
        control.updateValueAndValidity();
      }
    };

    updateDimensionsSectionControl('reel_length_limitation', reelLengthIsRequired);
    updateDimensionsSectionControl('reel_weight_limitation', reelWeightIsRequired);
  }

  getNumberOfColors() {
    let selectedApplicationType: CategoryModel = this.getDataSingleSelect(this.getApplicationSection.get('application_type').value);
    let selectedEstimatedApplicationType: CategoryModel = this.getDataSingleSelect(this.getApplicationSection.get('estimated_application_type').value);

    if (
      (selectedApplicationType && selectedApplicationType.title === RFQ.applicationNames.garmentBag) ||
      (selectedEstimatedApplicationType && selectedEstimatedApplicationType.title === RFQ.applicationNames.garmentBag)
    ) {
      this.numberOfColorsList = [1];
    } else {
      this.numberOfColorsList = [...this.allNumberOfColorsList];
    }

    // RESET
    this.resetNumberOfColorsField();
  }

  getPrinting() {
    let printingValue: boolean = this.getGraphicsSection.get('printing').value;
    this.printingStageId = null; // null by default

    // printing stage
    if (this.selectedProductInfo && this.selectedProductInfo.hasOwnProperty('printing_stage')) {
      let stageItem: StageItem = null;

      if (printingValue) { // when "True" - stage from product
        stageItem = this.getStageItemById(this.selectedProductInfo.printing_stage);
      } else { // when "False" - stage "Commercial" by default
        stageItem = this.getStageCommercialItem();
      }

      this.printingStageId = (stageItem) ? stageItem.id : null;
    }
  }

  getDigitalPrinting() {
    let printingValue: boolean = this.getGraphicsSection.get('printing').value;
    let digitalPrintingValue: boolean = this.getGraphicsSection.get('digital_printing').value;
    let selectedApplication = this.getDataSingleSelect(this.getApplicationSection.get('application').value);
    let selectedThickness: ThicknessItem = this.getDataSingleSelect(this.getProductSection.get('thickness').value);

    this.digitalPrintingIsVisible = false; // false by default
    this.digitalPrintingNotAvailableFilm = false; // false by default
    this.digitalPrintingStageId = null; // null by default

    // digital_printing visible and digital_printing not available for Film
    if (printingValue) { // when printing is true
      if (selectedApplication && (this.getApplicationIsReelFilm(selectedApplication) || this.getApplicationIsBagFilm(selectedApplication))) { // when application is ReelFilm or BagFilm
        if (selectedThickness && selectedThickness.title >= 60) { // when thickness >= 60
          this.digitalPrintingIsVisible = true;
        } else if (selectedThickness && selectedThickness.title < 60) { // when thickness < 60
          this.digitalPrintingNotAvailableFilm = true;
        }
      } else { // when other applications
        this.digitalPrintingIsVisible = true;
      }
    } else {
      this.digitalPrintingIsVisible = false;
    }

    // digital_printing stage
    if (digitalPrintingValue) { // UnderDev
      let stageItem = this.getStageUnderDevItem();
      this.digitalPrintingStageId = (stageItem) ? stageItem.id : null;
    } else { // Commercial
      let stageItem = this.getStageCommercialItem();
      this.digitalPrintingStageId = (stageItem) ? stageItem.id : null;
    }

    // SET Feedback for digital_printing
    this.setFeedbackSectionChildProperty(this.feedbackSection.production.digitalPrintingUnderDev , this.getIsStageUnderDev(this.digitalPrintingStageId));
  }

  getCertifications(preselectCertificationsList?: GraphicsSectionExternalLogo[]) {
    let selectedCertList: CertificateModel[] = [];
    let selectedRtf: string;

    while (this.getGraphicsSectionExternalLogo.length !== 0) {
      this.getGraphicsSectionExternalLogo.removeAt(0);
    }

    if (this.filteredApplicationInfo) { // sources from selected Application
      selectedRtf = (this.filteredApplicationInfo.rtf) ? this.filteredApplicationInfo.rtf : '';
      selectedCertList = (this.filteredApplicationInfo.certifications && this.filteredApplicationInfo.certifications.length)
        ? [...this.filteredApplicationInfo.certifications]
        : [];
    } else if (this.selectedProductInfo) { // sources from selected Product
      selectedRtf = (this.selectedProductInfo.rtf) ? this.selectedProductInfo.rtf : '';
      selectedCertList = (this.selectedProductInfo.certifications && this.selectedProductInfo.certifications.length)
        ? [...this.selectedProductInfo.certifications]
        : [];
    } else {
      selectedRtf = '';
      selectedCertList = [];
    }

    // RTF
    this.getGraphicsSection.get('rtf').setValue(selectedRtf, {emitEvent: false});

    // Certifications
    selectedCertList = selectedCertList.map(item => {
      let certItem: CertificateModel = _.cloneDeep(item);
      let certItemCategory: CategoryModel = (certItem && certItem.category_id)
        ? this.categories.find(certCategory => certCategory.id === certItem.category_id)
        : null;

      if (!certItem || !certItemCategory) { return null; }

      certItem.title = (certItemCategory.title) ? certItemCategory.title : '';
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

    // sorting certificates
    selectedCertList = _.orderBy(selectedCertList, ['category_id'], ['asc']);

    // SET certificates to form
    selectedCertList.map(item => {
      if (item.download && item.type !== AppConstants.CertificationTypeNames.FOOD) { // without food Certifications
        // preselect certificate
        let selectedItem: GraphicsSectionExternalLogo; // empty by default
        let selectedValue: boolean = false; // false by default
        if (preselectCertificationsList && Array.isArray(preselectCertificationsList)) {
          selectedItem = preselectCertificationsList.find(preItem => ( (item && item.category_id) && (preItem && preItem.id) && (item.category_id === preItem.id) ));
          selectedValue = (selectedItem) ? true : false;
        }

        this.getGraphicsSectionExternalLogo.push(new FormGroup({
          selected: new FormControl(selectedValue),
          id: new FormControl(item.category_id),
          certificate_name: new FormControl(item.title)
        }));
      }

      return item;
    });
  }

  setMoq(value) {
    this.getPricingSection.get('moq').setValue(
      (this.getTypeofIsNumber(value)) ? value : RFQ.nameNA,
      {emitEvent: false}
    );
    this.getPricingSection.get('moq').markAllAsTouched();
  }

  getItemsFieldFeedback() {
    let pricingItems: PricingSectionItems[] = this.getPricingSectionItems.value;
    let moqValue = this.getPricingSection.get('moq').value;

    let foundQuantityBelowMOQ: boolean = !!pricingItems.find(item => ( (item.quantity && moqValue) && (+item.quantity < +moqValue) ));
    let priceToBeEvaluated: boolean = !this.getCanBePriced();

    this.setFeedbackSectionChildProperty(this.feedbackSection.pricing.quantityBelowMOQ, foundQuantityBelowMOQ);
    this.setFeedbackSectionChildProperty(this.feedbackSection.pricing.priceToBeEvaluated, priceToBeEvaluated);
  }

  addItemsField() {
    this.getPricingSectionItems.push(
      new FormGroup({
        quantity: new FormControl(null, [Validators.required]),
        price_per_unit: new FormControl(''),
        price_total: new FormControl(''),
        eur_cost: new FormControl(null),
        usd_cost: new FormControl(null),
        convertor_cost_eur: new FormControl(null),
        convertor_cost_usd: new FormControl(null),
        eur_price: new FormControl(null),
        moq_unit: new FormControl(null),
        moq_meter: new FormControl(null),
        moq_kg: new FormControl(null),
        moq_impression: new FormControl(null),
        usd_price: new FormControl(null),
        total_eur_price: new FormControl(null),
        total_usd_price: new FormControl(null),
        private_quantity_note: new FormControl(''),
      })
    );
  }

  removeItemsField(index: number) {
    this.getPricingSectionItems.removeAt(index);
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

  saveRfqForm(submitAndClose: boolean): void {
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

  calculateMoq() {
    let data: RfqModel = this.transformData(this.rfqForm.value);
    let calculateMoq: boolean = true;

    // stop calculate, when rfq_is_for = customerTrial
    let rfqIsForValue = (this.getOtherSection.get('rfq_is_for')) ? this.getOtherSection.get('rfq_is_for').value : '';
    if (rfqIsForValue && rfqIsForValue === this.rfqIsFor.customerTrial) {
      return false;
    }

    if (
      this.getSegmentSection.invalid ||
      this.getApplicationSection.invalid ||
      this.getProductSection.invalid ||
      this.getAdditionalFeaturesSection.invalid ||
      this.getDimensionsSection.invalid ||
      this.getGraphicsSection.invalid ||
      this.getPricingSection.get('pricing_measure_unit').invalid
      ) {
      this.rfqForm.markAllAsTouched();
      // on this step 'items' field should be untouched
      this.getPricingSection.get('items').markAsUntouched();
      this.scrollToFirstInvalidControl();
      return false;
    }

    this.quoteRequestService.calculateRfq(data, calculateMoq).subscribe(
      (res: RfqModel) => {
        this.alertService.showSuccess('Request was successful');

        // SET moq to the rfqForm
        this.setMoq(res.pricing_section.moq);
      },
      (err: HttpErrorResponse) => {
        this.alertService.showError(err.error.message);
      }
    );
  }

  calculateRfqForm(): void {
    let data: RfqModel = this.transformData(this.rfqForm.value);
    let calculateMoq: boolean = false;

    // stop calculate, when rfq_is_for = customerTrial
    let rfqIsForValue = (this.getOtherSection.get('rfq_is_for')) ? this.getOtherSection.get('rfq_is_for').value : '';
    if (rfqIsForValue && rfqIsForValue === this.rfqIsFor.customerTrial) {
      return;
    }

    if (this.getPricingSectionItems.invalid) { return; }

    this.quoteRequestService.calculateRfq(data, calculateMoq).subscribe(
      (res: RfqModel) => {
        this.alertService.showSuccess('Request was successful');

        // SET itesm to the rfqForm
        res.pricing_section.items.map((item, index) => {
          // price_total
          this.getPricingSectionItems.controls[index].get('price_total').setValue(
            (this.getTypeofIsNumber(item.price_total)) ? item.price_total : RFQ.nameNA,
            {emitEvent: false}
          );
          this.getPricingSectionItems.controls[index].get('price_total').markAllAsTouched();

          // price_per_unit
          this.getPricingSectionItems.controls[index].get('price_per_unit').setValue(
            (this.getTypeofIsNumber(item.price_per_unit)) ? item.price_per_unit : RFQ.nameNA,
            {emitEvent: false}
          );
          this.getPricingSectionItems.controls[index].get('price_per_unit').markAllAsTouched();

          // eur_cost
          this.getPricingSectionItems.controls[index].get('eur_cost').setValue(
            (item.hasOwnProperty('eur_cost')) ? item.eur_cost : null,
            {emitEvent: false}
          );
          this.getPricingSectionItems.controls[index].get('eur_cost').markAllAsTouched();

          // usd_cost
          this.getPricingSectionItems.controls[index].get('usd_cost').setValue(
            (item.hasOwnProperty('usd_cost')) ? item.usd_cost : null,
            {emitEvent: false}
          );
          this.getPricingSectionItems.controls[index].get('usd_cost').markAllAsTouched();

          // convertor_cost_eur
          this.getPricingSectionItems.controls[index].get('convertor_cost_eur').setValue(
            (item.hasOwnProperty('convertor_cost_eur')) ? item.convertor_cost_eur : null,
            {emitEvent: false}
          );
          this.getPricingSectionItems.controls[index].get('convertor_cost_eur').markAllAsTouched();

          // convertor_cost_usd
          this.getPricingSectionItems.controls[index].get('convertor_cost_usd').setValue(
            (item.hasOwnProperty('convertor_cost_usd')) ? item.convertor_cost_usd : null,
            {emitEvent: false}
          );
          this.getPricingSectionItems.controls[index].get('convertor_cost_usd').markAllAsTouched();

          // eur_price
          this.getPricingSectionItems.controls[index].get('eur_price').setValue(
            (item.hasOwnProperty('eur_price')) ? item.eur_price : null,
            {emitEvent: false}
          );
          this.getPricingSectionItems.controls[index].get('eur_price').markAllAsTouched();

          // moq_unit
          this.getPricingSectionItems.controls[index].get('moq_unit').setValue(
            (item.hasOwnProperty('moq_unit')) ? item.moq_unit : null,
            {emitEvent: false}
          );
          this.getPricingSectionItems.controls[index].get('moq_unit').markAllAsTouched();

          // moq_meter
          this.getPricingSectionItems.controls[index].get('moq_meter').setValue(
            (item.hasOwnProperty('moq_meter')) ? item.moq_meter : null,
            {emitEvent: false}
          );
          this.getPricingSectionItems.controls[index].get('moq_meter').markAllAsTouched();

          // moq_kg
          this.getPricingSectionItems.controls[index].get('moq_kg').setValue(
            (item.hasOwnProperty('moq_kg')) ? item.moq_kg : null,
            {emitEvent: false}
          );
          this.getPricingSectionItems.controls[index].get('moq_kg').markAllAsTouched();

          // moq_impression
          this.getPricingSectionItems.controls[index].get('moq_impression').setValue(
            (item.hasOwnProperty('moq_impression')) ? item.moq_impression : null,
            {emitEvent: false}
          );
          this.getPricingSectionItems.controls[index].get('moq_impression').markAllAsTouched();

          // usd_price
          this.getPricingSectionItems.controls[index].get('usd_price').setValue(
            (item.hasOwnProperty('usd_price')) ? item.usd_price : null,
            {emitEvent: false}
          );
          this.getPricingSectionItems.controls[index].get('usd_price').markAllAsTouched();

          // total_eur_price
          this.getPricingSectionItems.controls[index].get('total_eur_price').setValue(
            (item.hasOwnProperty('total_eur_price')) ? item.total_eur_price : null,
            {emitEvent: false}
          );
          this.getPricingSectionItems.controls[index].get('total_eur_price').markAllAsTouched();

          // total_usd_price
          this.getPricingSectionItems.controls[index].get('total_usd_price').setValue(
            (item.hasOwnProperty('total_usd_price')) ? item.total_usd_price : null,
            {emitEvent: false}
          );
          this.getPricingSectionItems.controls[index].get('total_usd_price').markAllAsTouched();
        });

        // SET moq to the rfqForm
        this.setMoq(res.pricing_section.moq);
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
      opportunity_section: {
        ...this.opportunitySection
      },
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

    // rfq_section should be add only if there is a rfq_id parameter
    if (this.rfqId) {
      data.rfq_section = {
        id: (this.rfqId) ? String(this.rfqId) : '',
        action: (this.action) ? String(this.action) : 'create', // There are (create || update). Action "create" by default
      };
    }

    // type
    data.type = AppConstants.RfqFormTypeNames.CUSTOM || ''; // type always should be CUSTOM

    // form_mode
    let selectedFormMode: RfqFormModeModel = this.getSelectedFormMode();
    data.form_mode = (selectedFormMode) ? selectedFormMode.id : null;

    // Other's fields
    data.other_section.rfq_is_for = formData.other_section.rfq_is_for || '';

    // Segment's fields
    let selectedSegment: CategoryModel = this.getDataSingleSelect(formData.segment_section.segment);
    data.segment_section.segment = (selectedSegment)
      ? ({
        id: selectedSegment.id,
        title: selectedSegment.title
      })
      : null;
    let selectedSegmentType: CategoryModel = this.getDataSingleSelect(formData.segment_section.segment_type);
    data.segment_section.segment_type = (this.getControlSelectedOtherCategory(this.getSegmentSection.get('segment_type').value))
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
    let selectedPackedGoods: CategoryModel = this.getDataSingleSelect(formData.segment_section.packed_goods);
    data.segment_section.packed_goods = (this.getControlSelectedOtherCategory(this.getSegmentSection.get('packed_goods').value))
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
    let selectedPackaging: CategoryModel = this.getDataSingleSelect(formData.application_section.packaging);
    data.application_section.packaging = (selectedPackaging)
      ? ({
        id: selectedPackaging.id,
        title: selectedPackaging.title,
      })
      : null;
    let selectedApplication: CategoryModel = this.getDataSingleSelect(formData.application_section.application);
    data.application_section.application = (selectedApplication)
      ? ({
        id: selectedApplication.id,
        title: selectedApplication.title,
      })
      : null;
    let selectedApplicationType: CategoryModel = this.getDataSingleSelect(formData.application_section.application_type);
    data.application_section.application_type = (this.getControlSelectedOtherCategory(this.getApplicationSection.get('application_type').value))
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
    let selectedEstimatedApplicationType: CategoryModel = this.getDataSingleSelect(formData.application_section.estimated_application_type);
    data.application_section.estimated_application_type = (this.estimatedApplicationTypeIsOther)
      ? (selectedEstimatedApplicationType)
        ? ({
          id: selectedEstimatedApplicationType.id,
          title: formData.application_section.other_estimated_application_type,
        })
        : null
      : (selectedEstimatedApplicationType)
        ? ({
          id: selectedEstimatedApplicationType.id,
          title: selectedEstimatedApplicationType.title,
        })
        : null;

    // Product's fields
    let selectedProductFamily: CategoryModel = this.getDataSingleSelect(formData.product_section.product_family);
    data.product_section.product_family = (selectedProductFamily)
      ? ({
        id: selectedProductFamily.id,
        title: selectedProductFamily.title,
      })
      : null;
    let selectedProduct: CategoryModel = this.getDataSingleSelect(formData.product_section.product);
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
    let selectedThickness = this.getDataSingleSelect(formData.product_section.thickness);
    data.product_section.thickness = (selectedThickness) ? Number(selectedThickness.title) : 0;

    // AdditionalFeaturesSection's fields
    if (this.additionalFeaturesSectionIsVisible) {
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
    } else {
      data.additional_features_section = [];
    }

    // Dimensions's fields
    data.dimensions_section.width = +formData.dimensions_section.width;
    data.dimensions_section.height = (this.getIsPackaging())
      ? +formData.dimensions_section.height
      : null;
    data.dimensions_section.flap = (this.getIsPackaging() && this.isVisibleFlapField)
      ? formData.dimensions_section.flap
      : null;
    data.dimensions_section.closed_gusset = (this.getIsPackaging() && this.isVisibleGussetField)
      ? formData.dimensions_section.closed_gusset
      : null;
    let selectedCore: CategoryModel = this.getDataSingleSelect(formData.dimensions_section.core);
    data.dimensions_section.core = (this.getIsReel())
      ? (selectedCore)
        ? ({
          id: selectedCore.id,
          title: selectedCore.title,
        })
        : null
      : null;
    data.dimensions_section.reel_length_limitation = (this.getIsReel())
      ? formData.dimensions_section.reel_length_limitation
      : '';
    data.dimensions_section.box_weight_limitation = (this.getIsReel())
      ? formData.dimensions_section.box_weight_limitation
      : '';
    data.dimensions_section.od = (this.getIsReel())
      ? formData.dimensions_section.od
      : '';
    data.dimensions_section.reel_weight_limitation = (this.getIsReel())
      ? formData.dimensions_section.reel_weight_limitation
      : '';
    let selectedCof = this.getDataSingleSelect(formData.dimensions_section.cof);
    data.dimensions_section.cof = (this.getIsReel())
      ? (selectedCof) ? selectedCof.title : null
      : null;

    // Graphics's fields
    data.graphics_section.printing = formData.graphics_section.printing;
    data.graphics_section.digital_printing = (this.graphicsSectionIsVisible && this.digitalPrintingIsVisible)
      ? formData.graphics_section.digital_printing
      : false;
    data.graphics_section.number_of_colors = (this.graphicsSectionIsVisible && data.graphics_section.printing)
      ? this.getDataSingleSelect(formData.graphics_section.number_of_colors)
      : null;
    data.graphics_section.rtf = (this.graphicsSectionIsVisible && this.externalLogoIsVisible)
      ? formData.graphics_section.rtf
      : '';
    data.graphics_section.external_logo = (this.graphicsSectionIsVisible && this.externalLogoIsVisible)
      ? (formData.graphics_section.external_logo.filter(item => item.selected))
      : [];

    // Pricing's fields
    data.pricing_section.currency = formData.pricing_section.currency;
    let selectedShippingTerms: string = this.getDataSingleSelect(formData.pricing_section.shipping_terms);
    data.pricing_section.shipping_terms = (selectedShippingTerms) ? selectedShippingTerms : '';
    data.pricing_section.pricing_measure_unit = (formData.pricing_section.pricing_measure_unit && formData.pricing_section.pricing_measure_unit.length) ? formData.pricing_section.pricing_measure_unit[0].title : '';
    data.pricing_section.imp_width = (this.impFieldsIsVisible)
      ? formData.pricing_section.imp_width
      : null;
    data.pricing_section.imp_height = (this.impFieldsIsVisible)
      ? formData.pricing_section.imp_height
      : null;
    data.pricing_section.moq = (!formData.pricing_section.moq || isNaN(Number(formData.pricing_section.moq))) ? null : Number(formData.pricing_section.moq);
    data.pricing_section.annual_quantity_potential = formData.pricing_section.annual_quantity_potential;
    data.pricing_section.current_price_payed = formData.pricing_section.current_price_payed;
    data.pricing_section.current_material_used = formData.pricing_section.current_material_used;
    data.pricing_section.items = formData.pricing_section.items
      .map(item => {
        item.price_total = (!item.price_total || isNaN(Number(item.price_total))) ? null : Number(item.price_total);
        item.price_per_unit = (!item.price_per_unit || isNaN(Number(item.price_per_unit))) ? null : Number(item.price_per_unit);

        delete item.private_quantity_note; // delete, because it's private property only for the UI

        return item;
      });
    data.pricing_section.remarks = formData.pricing_section.remarks;

    // Feedback's fields
    this.getItemsFieldFeedback();
    this.setFeedbackSectionChildProperty(this.feedbackSection.production.digitalPrintingUnderDev , data.graphics_section.digital_printing);
    data.feedback_section.packed_goods = _.map(this.feedbackSection.packed_goods, (value, key) => value);
    data.feedback_section.production = _.map(this.feedbackSection.production, (value, key) => value);
    data.feedback_section.pricing = _.map(this.feedbackSection.pricing, (value, key) => value);

    return data;
  }

  getCanBePriced(): boolean {
    let items: any[] = this.getPricingSectionItems.value;
    let canNot: boolean = !!items.find(item => ( (!item.price_total || isNaN(Number(item.price_total))) || (!item.price_per_unit || isNaN(Number(item.price_per_unit))) ) ? item : null );

    return (canNot) ? false : true;
  }

  getControlSelectedOtherCategory(value: CategoryModel[]): boolean {
    if (!value || !value.length) { return false; }

    let selectedCategory: CategoryModel = value[0]; // because it's a single select
    return (selectedCategory && selectedCategory.id === this.otherCategory.id && selectedCategory.title === this.otherCategory.title) ? true : false;
  }

  getControlSelectedNACategory(value: CategoryModel): boolean {
    if (!value) { return false; }
    return (value && value.id === this.naCategory.id && value.title === this.naCategory.title) ? true : false;
  }

  getControlSelectedConvertingCategory(value: CategoryModel): boolean {
    if (!value) { return false; }
    return (value && value.id === this.convertingCategory.id && value.title === this.convertingCategory.title) ? true : false;
  }

  getFilteredPricingMeasureUnitList() {
    let value: CategoryModel[] = this.getApplicationSection.get('packaging').value;
    if (value && value.length) { // packaging OR reel
      this.pricingMeasureUnitList = (value[0].title === RFQ.packaging)
        ? this.allPricingMeasureUnitList.filter(unit => unit.title === RFQ.pricingMeasureUnitNames.units)
        : this.allPricingMeasureUnitList.filter(unit => unit.title !== RFQ.pricingMeasureUnitNames.units);
    } else {
      this.pricingMeasureUnitList = this.allPricingMeasureUnitList.filter(unit => unit);
    }

    if (this.getSelectedFormMode(AppConstants.RfqFormModeNames.SIMPLIFIED)) { // rfqForm is simpilfed
      this.pricingMeasureUnitList = this.pricingMeasureUnitList.filter(item => item.title !== RFQ.pricingMeasureUnitNames.imp); // without imp
    }

    // GET data
    this.getPricingMeasureUnitFields();

    // RESET
    this.resetPricingMeasureUnitField();
  }

  getPricingMeasureUnitFields() {
    this.impFieldsIsVisible = false; // false by default
    let selectedValue: PricingMeasureUnit = this.getDataSingleSelect(this.getPricingSection.get('pricing_measure_unit').value);

    if (this.getIsReel() && (selectedValue && selectedValue.title === RFQ.pricingMeasureUnitNames.imp)) {
      this.impFieldsIsVisible = true;
    }
  }

  getIsVisibleFlapField() {
    let additionalFeaturesSection: RfqFormModelAdditionalFeaturesSection[] = this.getAdditionalFeaturesSection.value;

    this.isVisibleFlapField = (additionalFeaturesSection && additionalFeaturesSection.length)
      ? !!additionalFeaturesSection.find(item =>
          item.list.find(itemFeature => (
            itemFeature.additional_feature_parent.includes(RFQ.additionalFeatures.flap.title) && (itemFeature.mandatory || itemFeature.selected)
          ))
        )
      : false;

    if (this.isVisibleFlapField) {
      this.getDimensionsSection.get('flap').setValidators([Validators.required]);
      this.getDimensionsSection.get('flap').updateValueAndValidity();
    } else {
      this.getDimensionsSection.get('flap').clearValidators();
      this.getDimensionsSection.get('flap').updateValueAndValidity();
    }
  }

  getIsVisibleGussetField() {
    let additionalFeaturesSection: RfqFormModelAdditionalFeaturesSection[] = this.getAdditionalFeaturesSection.value;

    this.isVisibleGussetField = (additionalFeaturesSection && additionalFeaturesSection.length)
      ? !!additionalFeaturesSection.find(item =>
          item.list.find(itemFeature => (
            itemFeature.additional_feature_parent.includes(RFQ.additionalFeatures.gusset.title) && (itemFeature.mandatory || itemFeature.selected)
          ))
        )
      : false;

    if (this.isVisibleGussetField) {
      this.getDimensionsSection.get('closed_gusset').setValidators([Validators.required]);
      this.getDimensionsSection.get('closed_gusset').updateValueAndValidity();
    } else {
      this.getDimensionsSection.get('closed_gusset').clearValidators();
      this.getDimensionsSection.get('closed_gusset').updateValueAndValidity();
    }
  }

  getIsPackaging(): boolean {
    let value: CategoryModel[] = this.getApplicationSection.get('packaging').value;
    return (value && value.length) ? value[0].title === RFQ.packaging : false;
  }

  getIsReel(): boolean {
    let value: CategoryModel[] = this.getApplicationSection.get('packaging').value;
    return (value && value.length) ? value[0].title === RFQ.reel : false;
  }

  getApplicationIsReelFilm(category?: CategoryModel): boolean {
    let selectedApplication: CategoryModel = this.getDataSingleSelect(this.getApplicationSection.get('application').value);
    let selectedCategory: CategoryModel = (category) ? category : selectedApplication;

    return (selectedCategory) ? selectedCategory.title === RFQ.applicationNames.reelFilm : false;
  }

  getApplicationIsBagFilm(category?: CategoryModel): boolean {
    let selectedApplication: CategoryModel = this.getDataSingleSelect(this.getApplicationSection.get('application').value);
    let selectedCategory: CategoryModel = (category) ? category : selectedApplication;

    return (selectedCategory) ? selectedCategory.title === RFQ.applicationNames.bagFilm : false;
  }

  getApplicationIsReelLaminate(category?: CategoryModel): boolean {
    let selectedApplication: CategoryModel = this.getDataSingleSelect(this.getApplicationSection.get('application').value);
    let selectedCategory: CategoryModel = (category) ? category : selectedApplication;

    return (selectedCategory) ? selectedCategory.title === RFQ.applicationNames.reelLaminate : false;
  }

  getApplicationIsPouchLaminate(category?: CategoryModel): boolean {
    let selectedApplication: CategoryModel = this.getDataSingleSelect(this.getApplicationSection.get('application').value);
    let selectedCategory: CategoryModel = (category) ? category : selectedApplication;

    return (selectedCategory) ? selectedCategory.title === RFQ.applicationNames.pouchLaminate : false;
  }

  getStageItemById(id: number): StageItem {
    let stageItem = AppConstants.StageItemList.find(stageItem => stageItem.id === id);
    return (stageItem) ? stageItem : null;
  }

  getStageCommercialItem(): StageItem {
    let stageItem = AppConstants.StageItemList.find(stageItem => stageItem.id === 1); // Commercial
    return (stageItem) ? stageItem : null;
  }

  getStageUnderDevItem(): StageItem {
    let stageItem = AppConstants.StageItemList.find(stageItem => stageItem.id === 2); // Under development
    return (stageItem) ? stageItem : null;
  }

  getIsStageCommercial(stage: number) {
    let stageItem = AppConstants.StageItemList.find(stageItem => stageItem.id === stage);
    let stageCommercialItem: StageItem = this.getStageCommercialItem();
    return (stageItem && stageCommercialItem && stageItem.id === stageCommercialItem.id); // Commercial
  }

  getIsStageUnderDev(stage: number) {
    let stageItem = AppConstants.StageItemList.find(stageItem => stageItem.id === stage);
    let stageUnderDevItem: StageItem = this.getStageUnderDevItem();
    return (stageItem && stageUnderDevItem && stageItem.id === stageUnderDevItem.id) ? true : false; // Under development
  }

  getIsQuantityCommercial(itemControl: AbstractControl): boolean {
    let quantityValue: number = (itemControl && itemControl.get('quantity')) ? +itemControl.get('quantity').value : null;
    let moqValue: number = (this.getPricingSection.get('moq')) ? +this.getPricingSection.get('moq').value : null;
    let rfqIsForValue: string = (this.getOtherSection.get('rfq_is_for')) ? this.getOtherSection.get('rfq_is_for').value : '';
    let pricingMeasureUnitItem: PricingMeasureUnit = (this.getPricingSection.get('pricing_measure_unit')) ? this.getDataSingleSelect(this.getPricingSection.get('pricing_measure_unit').value) : null;
    let pricingMeasureUnitValue: string = (pricingMeasureUnitItem) ? pricingMeasureUnitItem.title : '';

    // Validators
    if (rfqIsForValue && rfqIsForValue === this.rfqIsFor.customerTrial) { // when rfq_is_for = customerTrial
      if (
        (pricingMeasureUnitValue && pricingMeasureUnitValue === this.RFQ.pricingMeasureUnitNames.meter) &&
        (quantityValue && +quantityValue > 0 && +quantityValue <= 500)
        ) {
        return true;
      }
    } else {
      if (quantityValue && moqValue && (+quantityValue >= +moqValue)) {
        return true;
      }
    }

    return false;
  }

  getIsQuantityUnderDev(itemControl: AbstractControl): boolean {
    // controls
    let privateQuantityNoteControl = (itemControl && itemControl.get('private_quantity_note')) ? itemControl.get('private_quantity_note') : null;
    // values
    let quantityValue: number = (itemControl && itemControl.get('quantity')) ? +itemControl.get('quantity').value : null;
    let moqValue: number = (this.getPricingSection.get('moq')) ? +this.getPricingSection.get('moq').value : null;
    let rfqIsForValue: string = (this.getOtherSection.get('rfq_is_for')) ? this.getOtherSection.get('rfq_is_for').value : '';
    let pricingMeasureUnitItem: PricingMeasureUnit = (this.getPricingSection.get('pricing_measure_unit')) ? this.getDataSingleSelect(this.getPricingSection.get('pricing_measure_unit').value) : null;
    let pricingMeasureUnitValue: string = (pricingMeasureUnitItem) ? pricingMeasureUnitItem.title : '';

    // Validators
    if (rfqIsForValue && rfqIsForValue === this.rfqIsFor.customerTrial) { // when rfq_is_for = customerTrial
      if (
        (pricingMeasureUnitValue && pricingMeasureUnitValue === this.RFQ.pricingMeasureUnitNames.meter) &&
        (quantityValue && (+quantityValue < 0 || +quantityValue > 500))
        ) {
        let note: string = 'Trial Reel requires approval';

        if (privateQuantityNoteControl && privateQuantityNoteControl.value !== note) {
          privateQuantityNoteControl.setValue(note, {emitEvent: false});
        }

        return true;
      } else if (pricingMeasureUnitValue && pricingMeasureUnitValue !== this.RFQ.pricingMeasureUnitNames.meter) {
        let note: string = 'This trial requires approval';

        if (privateQuantityNoteControl && privateQuantityNoteControl.value !== note) {
          privateQuantityNoteControl.setValue(note, {emitEvent: false});
        }

        return true;
      }
    } else {
      if (quantityValue && moqValue && (+quantityValue < +moqValue)) {
        return true;
      }
    }

    // RESET quantity note
    if (privateQuantityNoteControl && privateQuantityNoteControl.value !== '') {
      privateQuantityNoteControl.setValue('', {emitEvent: false});
    }

    return false;
  }

  getDataSingleSelect(value: any[]) {
    return (value && value.length) ? value[0] : null;
  }

  getTypeofIsNumber(value: any) {
    return (typeof value === 'number') ? true : false;
  }

  getControlIsRequired(control: AbstractControl): boolean {
    if (!control || !control.validator) { return false; }

    const validator = control.validator({} as AbstractControl);
    if (validator && validator.required) { return true; }

    return false;
  }

  getInitialFormMode() {
    this.formModeList = this.formModeList.map(item => {
      item.checked = (item.id === AppConstants.RfqFormModeNames.FULL) ? true : false;
      return item;
    });

    let selectedFormMode: RfqFormModeModel = this.getSelectedFormMode();
    this.toggleFormMode(selectedFormMode);
  }

  getSelectedFormMode(modeId?: number): RfqFormModeModel {
    let selectedMode: RfqFormModeModel = this.formModeList.find(item => item.checked);

    return (modeId)
      ? (selectedMode && selectedMode.id === modeId) ? selectedMode : null // selected mode and checking
      : (selectedMode) ? selectedMode : null; // selected mode
  }

  toggleFormMode(newMode: RfqFormModeModel) {
    if (!newMode) { return false; } // return if mode is empty

    // toggle
    this.formModeList = this.formModeList.map(item => {
      item.checked = (item.id === newMode.id) ? true : false;
      return item;
    });

    if (this.getSelectedFormMode(AppConstants.RfqFormModeNames.FULL)) { // full mode
      // segment_section
      this.getSegmentSection.get('packed_goods').setValidators([Validators.required]);
      this.getSegmentSection.get('packed_goods').updateValueAndValidity();

      // application_section
      this.packagingIsDisabled = false;
      this.applicationIsDisabled = false;

      // additional_features_section
      this.additionalFeaturesSectionIsVisible = true;

      // dimensions_section
      this.getDimensionsSection.get('width').clearValidators();
      this.getDimensionsSection.get('width').updateValueAndValidity();

      this.getDimensionsSection.get('core').clearValidators();
      this.getDimensionsSection.get('core').updateValueAndValidity();

      // graphics_section
      this.graphicsSectionIsVisible = true;

      // pricing_section
      this.getFilteredPricingMeasureUnitList();
    } else { // simplified mode
      // segment_section
      this.getSegmentSection.get('packed_goods').clearValidators();
      this.getSegmentSection.get('packed_goods').updateValueAndValidity();

      // application_section
      this.packagingIsDisabled = true;
      let foundReel = this.packagingList.find(item => item.title === RFQ.reel);
      this.getApplicationSection.get('packaging').setValue((foundReel) ? [foundReel] : []); // auto set reel

      this.applicationIsDisabled = true;
      let foundReelFilm = this.applicationList.find(item => item.title === RFQ.applicationNames.reelFilm);
      this.getApplicationSection.get('application').setValue((foundReelFilm) ? [foundReelFilm] : []); // auto set reelFilm

      // additional_features_section
      this.additionalFeaturesSectionIsVisible = true;

      // dimensions_section
      this.getDimensionsSection.get('width').setValidators([Validators.required]);
      this.getDimensionsSection.get('width').updateValueAndValidity();

      this.getDimensionsSection.get('core').setValidators([Validators.required]);
      this.getDimensionsSection.get('core').updateValueAndValidity();

      // graphics_section
      this.graphicsSectionIsVisible = false;

      // pricing_section
      this.getFilteredPricingMeasureUnitList();
    }
  }

  scrollToFirstInvalidControl() {
    const firstInvalidControl: HTMLElement = this.elementRef.nativeElement.querySelector("form#form-custom .ng-invalid");

    if (firstInvalidControl) {
      firstInvalidControl.scrollIntoView();
    }
  }

  setFeedbackSectionChildProperty(item: FeedbackSectionItem, checked: boolean) {
    item.checked = (typeof checked === 'boolean') ? checked : false; // false by default
  }

  closePage(): void {
    // window.close();
    window.parent.postMessage({
      'func': 'parentFunc',
      'message': 'Message from iframe.'
    }, "*");
  }

  navigateToMainPage(): void {
    this.alertService.showError('Opportunity ID is invalid or not provided');
    this.router.navigate(['/']);
  }
}
