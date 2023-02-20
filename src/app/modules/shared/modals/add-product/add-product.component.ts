import { Component, OnInit, OnDestroy } from '@angular/core';
import { BsModalRef } from 'ngx-bootstrap/modal';
import { HttpErrorResponse } from '@angular/common/http';
import {
  FormBuilder,
  FormGroup,
  FormControl,
  Validators,
  FormArray,
} from '@angular/forms';
import { IDropdownSettings } from 'ng-multiselect-dropdown';
import {
  CategoryModel,
  ProductModel,
  MultiSelectModel,
  ImageModel,
  CertificateModel,
  ThicknessModel,
  ManufacturingTechniqueModel,
  AdditionalFeaturesModel,
  TdsModel,
  MsdsModel,
  CollateralsModel,
  LevelOfClearanceModel,
  StageItemIdsModel,
  CertificatesModel,
} from '@models';
import {
  ProductService,
  AlertService,
  MultiSelectService,
  FileService,
  AmplitudeService,
  ThicknessService,
} from '@services';
import { Subscription } from 'rxjs';
import { distinctUntilChanged, map } from 'rxjs/operators';
import { Store } from '@ngrx/store';
import * as fromApp from '@store/app.reducer';
import * as ProductActions from '@store/product/product.actions';
import * as ApplicationActions from '@store/application/application.actions';
import * as CategoryActions from '@store/category/category.actions';
import * as _ from 'lodash';
import { AppConstants } from '@core/app.constants';

export interface ThicknessFieldItem {
  values: any[];
  stage: number; // 0 | 1 | 2
}

enum SelectFieldEnum {
  thickness = 1,
  width = 2,
  height = 3,
  additionalFeatures = 4,
  tds = 5,
  msds = 6,
  collaterals = 7,
}

@Component({
  selector: 'app-add-product',
  templateUrl: './add-product.component.html',
  styleUrls: ['./add-product.component.scss'],
})
export class AddProductComponent implements OnInit, OnDestroy {
  private categorySubscription: Subscription;
  private thicknessSubscription: Subscription;

  public selectFieldEnum = SelectFieldEnum;

  public isCreateModal: boolean;
  public formData: ProductModel;
  public productForm: FormGroup;
  public categories: CategoryModel[] = [];
  // Family
  public familyList: CategoryModel[];
  public familySelectedItems: MultiSelectModel[] = [];
  public familyRequiredField: boolean;
  public familyChangedSelect: boolean;
  // Stage
  public stageItemIds: StageItemIdsModel = AppConstants.StageItemIds;
  public stageList: any = AppConstants.StageItemList.filter(item => item.id !== 0); // without stage "Fast track" id:0
  public stageSelectedItems: MultiSelectModel[] = [];
  public stageRequiredField: boolean;
  public stageChangedSelect: boolean;
  // level_of_clearance
  public levelOfClearanceList: LevelOfClearanceModel[] = _.cloneDeep(AppConstants.LevelOfClearanceList);
  public levelOfClearanceIsVisible: boolean;
  // display_priority
  public displayPriorityList: number[] = _.cloneDeep(AppConstants.DisplayPriorityList);
  // Application
  public packagingList: CategoryModel[] = [];
  public applicationsList: CategoryModel[] = [];
  // Manufacturing technique
  public manufacturingTechniqueList: ManufacturingTechniqueModel[] = AppConstants.ManufacturingTechniqueList;
  // Thickness
  public thicknessList: any[] = [];
  public thicknessFieldList: ThicknessFieldItem[] = [
    { values: [], stage: null }
  ];
  public thicknessRequiredField: boolean;
  public thicknessChangedSelect: boolean;
  // AdditionalFeatures
  public additionalFeaturesList: any[] = [];
  public additionalFeaturesFieldList: AdditionalFeaturesModel[] = [
    { ids: [], stage: null, mandatory: false }
  ];
  // Segment fields
  public segmentList: CategoryModel[] = [];
  public segmentTypeList: CategoryModel[] = [];
  public packedGoodsList: CategoryModel[] = [];
  // collaterals
  public collateralsFieldList: CollateralsModel[] = [
    { url: '', }
  ];
  // tds
  public tdsFieldList: TdsModel[] = [
    { url: '', }
  ];
  // msds
  public msdsFieldList: MsdsModel[] = [
    { url: '' }
  ];
  public files: any[] = [];
  public technicalConsiderationFile: File = null;
  public barrierFile: File = null;
  public printabilityFile: File = null;
  public certificatesFiles: CertificateModel[] = [];
  public newFiles: File[] = [];

  public multiDropdownSettings: IDropdownSettings = {
    singleSelection: false,
    idField: 'id',
    textField: 'title',
    itemsShowLimit: 1,
    allowSearchFilter: false,
    enableCheckAll: false,
  };
  public singleDropdownSettings: IDropdownSettings = {
    singleSelection: true,
    idField: 'id',
    textField: 'title',
    itemsShowLimit: 1,
    allowSearchFilter: false,
    enableCheckAll: false,
    closeDropDownOnSelection: true,
  };
  public singleSearchDropdownSettings: IDropdownSettings = _.cloneDeep({
    ...this.singleDropdownSettings,
    allowSearchFilter: true,
  });

  // Old Certificates
  public compostabilityLogosList: CategoryModel[] = [];
  public foodContactsList: CategoryModel[] = [];
  public certificates: CertificateModel[] = [];

  // Certificates
  public certifiedByList: CategoryModel[] = [];
  public availableProductCertificatesList: CategoryModel[] = [];
  public availableCertificateThicknessList: (number | string)[] = [];

  // PrintingAvailableMethodList
  public printingAvailableMethodList: CategoryModel[] = [];
  public printingMethodAvailableFieldsList: ThicknessFieldItem[] = [
    { values: [], stage: null }
  ];

  // Available in these Territories
  public availableInThisTerritoriesList: CategoryModel[] = [];
  public availableInThisTerritoriesFieldsList: ThicknessFieldItem[] = [
    { values: [], stage: null }
  ];

  // Partners List
  public partnersList: CategoryModel[] = [];

  // Measure Unit List
  public measureUnitList: CategoryModel[] = [];

  // MOQ
  public moqListRequiredField: boolean;

  public stageSelectedItemId: number;

  constructor(
    private bsModalRef: BsModalRef,
    private formBuilder: FormBuilder,
    private store: Store<fromApp.AppState>,
    private productService: ProductService,
    private alertService: AlertService,
    private multiSelectService: MultiSelectService,
    private fileService: FileService,
    private amplitudeService: AmplitudeService,
    private thicknessService: ThicknessService,
  ) {
    this.productForm = this.formBuilder.group({
      title: new FormControl('', [Validators.required]),
      description: new FormControl('', [Validators.required]),
      images: new FormArray([]),
      family: new FormArray([]),
      stage: new FormControl(''),
      level_of_clearance: new FormControl([]), // required is dynamic, when levelOfClearanceIsVisible
      display_priority: new FormControl([], [Validators.required]),
      segment: new FormControl([], [Validators.required]),
      segment_type: new FormControl([]),
      packed_goods: new FormControl([]),
      packaging: new FormControl(null),
      application: new FormControl(null, [Validators.required]),
      manufacturing_technique: new FormControl(null),
      printing_stage: new FormControl(null),
      thickness: new FormArray([]),
      width: new FormArray([new FormGroup({
        min: new FormControl(null),
        max: new FormControl(null),
        stage: new FormControl(null),
        measure_unit: new FormControl(null)
      })]),
      height: new FormControl(''),
      additional_features: new FormControl([]),
      features: new FormControl(''),
      terms_and_limitations: new FormControl(''),
      technical_considerations: new FormGroup({
        description: new FormControl(''),
        url: new FormControl(''),
      }),
      barrier: new FormGroup({
        description: new FormControl(''),
        url: new FormControl(''),
      }),
      printability: new FormGroup({
        description: new FormControl(''),
        url: new FormControl(''),
      }),
      tds: new FormControl(null),
      msds: new FormControl(null),
      collaterals: new FormControl(null),
      rtf: new FormControl(''),
      certifications: new FormArray([]),
      certificates: new FormArray([this.getInitialCertificatesItem()]),
      draft: new FormControl(false),
      printing_method: new FormArray([]),
      available_territories: new FormControl(null),
      partner_name: new FormControl([]),
      moqArray: new FormArray([new FormGroup({
        moq: new FormControl(null, [Validators.required]),
        measure_unit: new FormControl(null),
        notes: new FormControl(null),
        stage: new FormControl(null)
      })]),
      notes_area: new FormControl(''),
      production_site: new FormControl(null)
    });
  }

  ngOnInit() {
    this.productForm.get('segment').valueChanges
      .pipe(distinctUntilChanged((x, y) => JSON.stringify(x) === JSON.stringify(y)))
      .subscribe(value => {
        this.checkSegmentValue();
        this.getSegmentTypeList();
      });

    this.productForm.get('segment_type').valueChanges
      .pipe(distinctUntilChanged((x, y) => JSON.stringify(x) === JSON.stringify(y)))
      .subscribe(value => {
        this.checkSegmentTypeValue();
        this.getPackedGoodsList();
      });

    this.productForm.get('packed_goods').valueChanges
      .pipe(distinctUntilChanged((x, y) => JSON.stringify(x) === JSON.stringify(y)))
      .subscribe(value => {
        this.checkPackedGoodsValue();
      });

    this.productForm.get('packaging').valueChanges.subscribe(value => {
      this.getApplicationsList();
      // Reset application
      this.productForm.get('application').setValue(null);
    });

    this.getCertificatesArray.valueChanges
      .pipe(distinctUntilChanged((x, y) => JSON.stringify(x) === JSON.stringify(y)))
      .subscribe(() => {
        // Need to update lists, because it's dynamic lists
        this.getCertificatesArray.controls.map(itemControl => {
          const certifiedByControl = itemControl?.get('certified_by');
          const certifiedByValue: CategoryModel[] = (certifiedByControl) ? certifiedByControl?.value || [] : [];
          const certificateControl = itemControl?.get('certificate');
          const certificateValueListValue: CategoryModel[] = (certificateControl?.get('value_list')) ? certificateControl?.get('value_list')?.value || [] : [];

          const preselectDataList: CategoryModel[] = this.availableProductCertificatesList.filter(item => {
            return (Array.isArray(certifiedByValue) && certifiedByValue.length)
              ? certifiedByValue.find(item2 => {
                const certificateCategory: CategoryModel = this.categories.find(category => category?.id === item?.id);
                return item2?.id === certificateCategory?.metadata?.certificate_certified_by;
              })
              : true;
          });

          const preselectValueList: CategoryModel[] = (Array.isArray(certificateValueListValue))
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

    // GET data lists
    this.getThickness();
  }

  ngOnDestroy() {
    if (this.categorySubscription) {
      this.categorySubscription.unsubscribe();
    }
    if (this.thicknessSubscription) {
      this.thicknessSubscription.unsubscribe();
    }
  }

  getThickness() {
    this.thicknessSubscription = this.thicknessService.getThickness().subscribe((thickness: ThicknessModel[]) => {
      this.thicknessList = [...thickness];

      if (this.formData) {
        // SET Thickness
        const setThicknessFieldList = [];
        this.formData.thickness.map((item) => {
          const obj = {
            stage: item.stage,
            values: []
          };

          item.values.map((value) => {
            return this.thicknessList.find((thicknessEl) => {
              if (value == thicknessEl.value) {
                obj.values.push(thicknessEl);
              }
            });
          });

          setThicknessFieldList.push(obj);
        });
        this.thicknessFieldList = setThicknessFieldList;

        setTimeout(() => {
          this.setThicknessStatus();
        }, 1000);
      }

      // GET data lists
      this.getCategories();
      this.getAvailableCertificateThicknessList();
    });
  }

  getCategories() {
    this.categorySubscription = this.store
      .select('categories')
      .pipe(map((categoryStore) => categoryStore.categories))
      .subscribe((categories: CategoryModel[]) => {
        this.categories = categories;

        if (categories.length > 0) {
          // GET data lists
          this.getCertifiedByList();
          this.getPrintingAvailableMethodList();
          this.getAvailableInThisTerritoriesList();
          this.getPartners();
          this.getMeasureUnitList();
          this.getAvailableProductCertificatesList();

          this.familyList = this.multiSelectService.getDropdownById(
            categories,
            2
          );
          // Segment
          this.getSegmentList();

          // Packaging
          const APPLICATION = AppConstants.MainCategoryNames.APPLICATION;
          const applicationsParent = categories.find((item) => (item.title === APPLICATION.title && item.level === APPLICATION.level));
          if (applicationsParent) {
            this.packagingList = this.multiSelectService.getDropdownById(
              categories,
              applicationsParent.id
            );
          }
          const defaultReel = (this.packagingList && this.packagingList.length)
            ? this.packagingList.find(item => item.title.includes('Reel'))
            : null;
          this.productForm.get('packaging').setValue((defaultReel) ? [defaultReel] : null);

          // GET AdditionalFeaturesList
          const ADDITIONAL_FEATURES = AppConstants.MainCategoryNames.ADDITIONAL_FEATURES;
          const additionalFeaturesParent = this.categories
            .find((item) => (item.title === ADDITIONAL_FEATURES.title && item.level === ADDITIONAL_FEATURES.level));
          if (additionalFeaturesParent) {
            const secondLevelList = this.multiSelectService.getDropdownById(
              categories,
              additionalFeaturesParent.id
            );

            const thirdLevelList = secondLevelList.map((parent) => {
              return this.multiSelectService.getDropdownById(categories, parent.id);
            });

            thirdLevelList.map(arr => this.additionalFeaturesList.push(...arr));
          }

          // Compostability logos
          const COMPOSTABILITY_LOGOS = AppConstants.MainCategoryNames.COMPOSTABILITY_LOGOS;
          const compostabilityLogosParent = categories.find((item) => (item.title === COMPOSTABILITY_LOGOS.title && item.level === COMPOSTABILITY_LOGOS.level));
          if (compostabilityLogosParent) {
            this.compostabilityLogosList = this.multiSelectService.getDropdownById(categories, compostabilityLogosParent.id);
          }

          // Food contacts
          const FOOD_CONTACTS = AppConstants.MainCategoryNames.FOOD_CONTACTS;
          const foodContactsParent = categories.find((item) => (item.title === FOOD_CONTACTS.title && item.level === FOOD_CONTACTS.level));
          if (foodContactsParent) {
            this.foodContactsList = this.multiSelectService.getDropdownById(categories, foodContactsParent.id);
          }

          // GET initial data
          this.getInitialCertificates();
        }

        if (this.formData) {
          // GET/SET packaging
          const foundApplication = (this.formData.application && this.formData.application.length)
            ? this.categories.find(category => category.id === this.formData.application[0])
            : null;
          let foundPackaging = (foundApplication)
            ? this.categories.find(category => category.id === foundApplication.parent_id)
            : null;
          if (!foundPackaging) { // Default as Reel
            foundPackaging = (this.packagingList && this.packagingList.length)
              ? this.packagingList.find(item => item.title.includes('Reel'))
              : null;
          }
          this.productForm.get('packaging').setValue((foundPackaging) ? [foundPackaging] : null);
          this.getApplicationsList();

          // application
          const selectedApplication = (this.formData.application && this.formData.application.length && this.applicationsList.length)
            ? this.applicationsList.find(item => item.id === this.formData.application[0])
            : null;

          // manufacturing_technique
          const selectedMT = (this.formData.manufacturing_technique)
            ? this.manufacturingTechniqueList.find(item => item.id === this.formData.manufacturing_technique)
            : null;

          // segment
          const preselectSegment: CategoryModel[] = this.multiSelectService.preselectOptions(
            this.formData.segment,
            categories
          );

          // segment_type
          const preselectSegmentType: CategoryModel[] = this.multiSelectService.preselectOptions(
            this.formData.segment_type,
            categories
          );

          // packed_goods
          const preselectPackedGoods: CategoryModel[] = this.multiSelectService.preselectOptions(
            this.formData.packed_goods,
            categories
          );

          // level_of_clearance
          const foundLevelOfClearanceItem: LevelOfClearanceModel = (this.formData.level_of_clearance)
            ? this.levelOfClearanceList.find(item => (item && item.id === this.formData.level_of_clearance))
            : null;
          const preselectLevelOfClearance: LevelOfClearanceModel[] = (foundLevelOfClearanceItem) ? [foundLevelOfClearanceItem] : [];

          // partner_name
          const preselectPartnerName: CategoryModel[] = this.multiSelectService.preselectOptions(
            this.formData.partner_name,
            categories
          );

          this.productForm.get('production_site').setValue(this.formData.production_site);
          this.productForm.get('notes_area').setValue(this.formData.notes_area);
          this.productForm.patchValue({
            ...this.formData,
            certificates: [],
            level_of_clearance: preselectLevelOfClearance,
            display_priority: (this.formData.display_priority && this.displayPriorityList.find(item => item === this.formData.display_priority)) ? [this.formData.display_priority] : [5], // 5 as default
            segment: (preselectSegment && Array.isArray(preselectSegment)) ? preselectSegment : [],
            segment_type: (preselectSegmentType && Array.isArray(preselectSegmentType)) ? preselectSegmentType : [],
            packed_goods: (preselectPackedGoods && Array.isArray(preselectPackedGoods)) ? preselectPackedGoods : [],
            width: [],
            moqArray: [],
            application: (selectedApplication) ? [selectedApplication] : null,
            manufacturing_technique: (selectedMT) ? [selectedMT] : null,
            tds: this.formData.tds || {},
            technical_considerations:
              this.formData.technical_considerations || {},
            barrier: this.formData.barrier || {},
            printability: this.formData.printability || {},
            partner_name: (preselectPartnerName && Array.isArray(preselectPartnerName)) ? preselectPartnerName : [],
          });

          this.files = this.formData.images;
          this.technicalConsiderationFile =
            this.formData && this.formData.technical_considerations
              ? this.formData.technical_considerations.url
              : null;
          this.barrierFile = (this.formData && this.formData.barrier)
            ? this.formData.barrier.url
            : null;
          this.printabilityFile = (this.formData && this.formData.printability)
            ? this.formData.printability.url
            : null;
          this.certificatesFiles = _.cloneDeep(this.formData.certifications);

          // collaterals
          this.collateralsFieldList = (this.formData && this.formData.collaterals && this.formData.collaterals.length)
            ? _.cloneDeep(this.formData.collaterals)
            : [{ url: '' }];

          // tds
          this.tdsFieldList = (this.formData && this.formData.tds && this.formData.tds.length)
            ? _.cloneDeep(this.formData.tds)
            : [{ url: '' }];

          // msds
          this.msdsFieldList = (this.formData && this.formData.msds && this.formData.msds.length)
            ? _.cloneDeep(this.formData.msds)
            : [{ url: '' }];

          // width
          if (this.formData.width && this.formData.width.length) {
            while (this.getWidth.length !== 0) {
              this.getWidth.removeAt(0);
            }

            this.formData.width.map(item => {
              let preselectMeasureUnit: CategoryModel[] = null;
              if (item.measure_unit) {
                preselectMeasureUnit = this.multiSelectService.preselectOptions(
                  item.measure_unit,
                  categories
                );
              }
              this.getWidth.push(new FormGroup({
                min: new FormControl(item.min),
                max: new FormControl(item.max),
                stage: new FormControl(item.stage),
                measure_unit: new FormControl(preselectMeasureUnit),
              }));
            });
          }

          // moq
          this.moqListRequiredField = true;
          if (this.formData.moq && this.formData.moq.length) {
            while (this.getMOQ.length !== 0) {
              this.getMOQ.removeAt(0);
            }

            this.formData.moq.map(item => {
              let preselectMeasureUnit: CategoryModel[] = null;
              if (item.measure_unit) {
                preselectMeasureUnit = this.multiSelectService.preselectOptions(
                  item.measure_unit,
                  categories
                );
              }

              this.getMOQ.push(new FormGroup({
                moq: new FormControl(item.moq, [Validators.required]),
                measure_unit: new FormControl(preselectMeasureUnit),
                notes: new FormControl(item.notes),
                stage: new FormControl(null)
              }));
            });
          }

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
              this.printingMethodAvailableFieldsList.push({ values: [], stage: null });
            }
          }

          // available_territories
          if (this.formData.available_territories && this.formData.available_territories.length) {
            this.availableInThisTerritoriesFieldsList = JSON.parse(JSON.stringify(this.formData.available_territories))
              .filter((item) => {
                item.values = item.values.filter((el) => (typeof el === 'string') ? el : false);
                return item;
              })
              .map((item) => {
                item.values = item.values.map((title) => {
                  return this.availableInThisTerritoriesList.find((obj) => obj.title === title);
                });
                return item;
              })
              .filter((item) => {
                item.values = item.values.filter((el) => (el) ? el : false);
                return (item.values.length > 0);
              });

            // If array is empty, set first item
            if (!this.availableInThisTerritoriesFieldsList.length) {
              this.availableInThisTerritoriesFieldsList.push({ values: [], stage: null });
            }
          }

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
              this.additionalFeaturesFieldList.push({ ids: [], stage: null, mandatory: false });
            }
          }

          // Set family
          this.familySelectedItems = this.multiSelectService.preselectOptions(
            this.formData.family,
            categories
          );

          // Set stage
          this.stageSelectedItems = this.stageList.filter((item) => item.id === this.formData.stage);

          this.setFamilyStatus();
          this.setStageStatus();
          this.preselectCertificates(this.formData.certifications); // Old certifications
          this.preselectCertificatesArray(this.formData.certificates);
        } else {
          // Default values
          this.productForm?.get('display_priority')?.setValue([5], { emitEvent: false });
        }
      }
      );
  }

  getApplicationsList() {
    const value = this.productForm.get('packaging').value;

    this.applicationsList = [];
    if (value && value.length) {
      const copyApplicationSelected = this.multiSelectService
        .transformSelectData(_.cloneDeep(value))
        .filter(id => id);
      this.applicationsList = this.multiSelectService.getDropdownByArray(this.categories, copyApplicationSelected);
    }
  }

  getInitialCertificates() {
    this.certificates = [...this.compostabilityLogosList, ...this.foodContactsList].map(category => {
      const category_id = category.id;
      const title = category.title;
      const type = (category.metadata && category.metadata.certification_type)
        ? category.metadata.certification_type
        : '';
      const logo = (category.metadata && category.metadata.certification_logo)
        ? category.metadata.certification_logo
        : '';
      const files = this.multiSelectService.getDropdownById(this.categories, category.id).map(subItem => ({
        title: subItem.title,
        file: (subItem.metadata && subItem.metadata.certification_file) ? subItem.metadata.certification_file : '',
      }));

      return {
        file_url: '',
        description: '',
        download: true,
        category_id,
        title,
        type,
        logo,
        files,
      };
    });
  }

  addCertificateFile(file: FileList, certificate: CertificateModel) {
    certificate.file_url = file[0];
  }

  deleteCertificateFile(certificate: CertificateModel) {
    certificate.file_url = '';
  }

  saveMaterial(draft: boolean) {
    const data = JSON.parse(JSON.stringify(this.productForm.value));
    data.family = this.multiSelectService.transformSelectData(
      this.familySelectedItems
    );
    data.stage = this.getStageId();

    // level_of_clearance
    const selectedLevelOfClearance: LevelOfClearanceModel[] = this.productForm.get('level_of_clearance').value;
    const selectedLevelOfClearanceValue: number = (Array.isArray(selectedLevelOfClearance) && selectedLevelOfClearance.length) ? selectedLevelOfClearance[0].id : null;
    data.level_of_clearance = (this.levelOfClearanceIsVisible) ? selectedLevelOfClearanceValue : null;

    data.display_priority = (data.display_priority && data.display_priority.length)
      ? data.display_priority[0]
      : 5; // 5 as default
    data.application = (data.application && data.application.length)
      ? [data.application[0].id]
      : null;
    data.manufacturing_technique = (data.manufacturing_technique && data.manufacturing_technique.length)
      ? data.manufacturing_technique[0].id
      : null;

    if (data.width[0].min != null && data.width[0].max != null && data.width[0].measure_unit != null) {
      data.width = data.width
        .map(item => {
          return {
            min: this.getTypeofNumber(item.min) ? item.min : null,
            max: this.getTypeofNumber(item.max) ? item.max : null,
            measure_unit: (item.measure_unit && item.measure_unit[0]) ? [item.measure_unit[0].id] : null,
            stage: item.stage,
          };
        });
    } else {
      data.width = [];
    }

    data.thickness = JSON.parse(JSON.stringify(this.thicknessFieldList))
      .filter((item) => (item.values.length > 0))
      .map((item) => {
        item.values = item.values.map((obj) => obj.value);
        return item;
      });
    data.additional_features = JSON.parse(JSON.stringify(this.additionalFeaturesFieldList))
      .filter((item) => (item.ids.length > 0))
      .map((item) => {
        item.ids = item.ids.map((obj) => obj.id);
        return item;
      });
    data.segment = this.multiSelectService.transformSelectData(
      data.segment
    );
    data.segment_type = this.multiSelectService.transformSelectData(
      data.segment_type
    );
    data.packed_goods = this.multiSelectService.transformSelectData(
      data.packed_goods
    );
    data.certifications = this.getSelectedCertificates;
    data.certificates = this.getTransformedCertificates(data?.certificates);
    data.collaterals = this.collateralsFieldList.filter(collateralsItem => (collateralsItem && collateralsItem.url)); // without empty items
    data.tds = this.tdsFieldList.filter(tdsItem => (tdsItem && tdsItem.url)); // without empty items
    data.msds = this.msdsFieldList.filter(msdsItem => (msdsItem && msdsItem.url)); // without empty items

    data.printing_method = JSON.parse(JSON.stringify(this.printingMethodAvailableFieldsList))
      .filter((item) => (item.values.length > 0))
      .map((item) => {
        item.values = item.values.map((obj) => obj.title);
        return item;
      });
    data.available_territories = JSON.parse(JSON.stringify(this.availableInThisTerritoriesFieldsList))
      .filter((item) => (item.values.length > 0))
      .map((item) => {
        item.values = item.values.map((obj) => obj.title);
        return item;
      });

    data.moq = data.moqArray.map(item => {
      return {
        moq: this.getTypeofNumber(item.moq) ? item.moq : null,
        notes: item.notes ? item.notes : null,
        measure_unit: (item.measure_unit && item.measure_unit[0]) ? [item.measure_unit[0].id] : null,
        stage: item.stage
      };
    });

    data.partner_name = this.multiSelectService.transformSelectData(
      data.partner_name
    );

    delete data.packaging;
    delete data.moqArray;

    this.uploadAllFiles(data).then((response: ProductModel) => {
      response.draft = draft;
      if (this.isCreateModal) {
        this.productService.addProduct(response).subscribe(
          (newMaterial: ProductModel) => {
            this.store.dispatch(new ProductActions.AddProduct(newMaterial));
            this.store.dispatch(new ApplicationActions.FetchApplications(true));
            this.store.dispatch(new CategoryActions.FetchCategories());
            this.closeModal();
            this.alertService.showSuccess('Successfully added!');
            this.amplitudeService.addNewEvent(
              this.formData ? 'Duplicate material' : 'Add new material',
              {
                materialId: newMaterial.id,
                materialTitle: newMaterial.title,
              }
            );
          },
          (err: HttpErrorResponse) => {
            this.alertService.showError(err.error.message);
          }
        );
      } else {
        this.productService.updateProduct(this.formData.id, response).subscribe(
          (updatedMaterial: ProductModel) => {
            this.store.dispatch(
              new ProductActions.UpdateProduct({
                productId: this.formData.id,
                newProduct: updatedMaterial,
              })
            );
            this.closeModal();
            this.alertService.showSuccess('Successfully updated!');
            this.amplitudeService.addNewEvent('Edit material', {
              materialId: updatedMaterial.id,
              materialTitle: updatedMaterial.title,
            });
          },
          (err: HttpErrorResponse) => {
            this.alertService.showError(err.error.message);
          }
        );
      }
    });
  }

  addFileEvent(images: { newImages: File[]; oldImages: ImageModel[] }) {
    this.files = images.oldImages;
    this.newFiles = images.newImages;
  }

  closeModal() {
    this.bsModalRef.hide();
  }

  getMultiDropdownSettings(newSettings?: IDropdownSettings) {
    return Object.assign({}, this.multiDropdownSettings, newSettings);
  }

  getStageId(): number {
    this.stageSelectedItemId = (this.stageSelectedItems.length > 0) ? this.stageSelectedItems[0].id : null;
    return this.stageSelectedItemId;
  }

  addThicknessField() {
    this.thicknessFieldList.push({
      values: [],
      stage: null
    });
    this.setThicknessStatus();
  }

  addPrintingMethod() {
    this.printingMethodAvailableFieldsList.push({
      values: [],
      stage: null
    });
  }

  addTerritories() {
    this.availableInThisTerritoriesFieldsList.push({
      values: [],
      stage: null
    });
  }

  deleteThicknessField(itemField) {
    if (this.thicknessFieldList.length === 1) {
      return false;
    }

    this.thicknessFieldList = this.thicknessFieldList.filter((item) => (item != itemField));
    this.setThicknessStatus();
  }

  deletePrintingField(itemField) {
    if (this.printingMethodAvailableFieldsList.length === 1) {
      return false;
    }

    this.printingMethodAvailableFieldsList = this.printingMethodAvailableFieldsList.filter((item) => (item != itemField));
  }

  deleteTerritoriesField(itemField) {
    if (this.availableInThisTerritoriesFieldsList.length === 1) {
      return false;
    }

    this.availableInThisTerritoriesFieldsList = this.availableInThisTerritoriesFieldsList.filter((item) => (item != itemField));
  }

  deleteMOQField(index: number) {
    this.getMOQ.removeAt(index);
  }

  setThicknessStatus() {

    this.thicknessChangedSelect = true;
    const found = this.thicknessFieldList.find((item) => (item.values.length > 0));

    if (this.stageSelectedItems.length && this.stageSelectedItems[0].id !== 4) {
      this.thicknessRequiredField = !!found;
    }
    // GET data lists
    this.getAvailableCertificateThicknessList();
  }

  setFamilyStatus() {
    this.familyChangedSelect = true;
    this.familySelectedItems.length > 0
      ? (this.familyRequiredField = true)
      : (this.familyRequiredField = false);
  }

  setStageStatus() {
    this.stageChangedSelect = true;

    if (this.stageSelectedItems.length && this.stageSelectedItems[0].id === 4) {
      this.thicknessRequiredField = true;
    }
    if (this.stageSelectedItems.length > 0) {
      this.stageRequiredField = true;
      this.stageSelectedItemId = this.stageSelectedItems[0].id;
    } else {
      this.stageRequiredField = false;
    }

    this.toggleValidatorsLevelOfClearance();
    this.toggleValidatorsTermsAndLimitations();
  }

  getSegmentList() {
    const SEGMENTS = AppConstants.MainCategoryNames.SEGMENTS;
    const segmentListParent = this.categories
      .find((category) => (category.title === SEGMENTS.title && category.level === SEGMENTS.level));
    if (segmentListParent) {
      this.segmentList = this.multiSelectService.getDropdownById(this.categories, segmentListParent.id);
    }
  }

  checkSegmentValue() {
    const segmentControl = this.productForm.get('segment');
    const SEGMENTS = AppConstants.MainCategoryNames.SEGMENTS;
    const segmentListParent = this.categories
      .find((category) => (category.title === SEGMENTS.title && category.level === SEGMENTS.level));
    const parentList = (segmentListParent) ? [segmentListParent] : [];

    const checkedValuesList = this.checkNextValues(parentList, segmentControl.value);
    segmentControl.setValue((checkedValuesList && Array.isArray(checkedValuesList)) ? checkedValuesList : []);
  }

  getSegmentTypeList() {
    const segmentControl = this.productForm.get('segment');

    const copySegmentSelected = this.multiSelectService.transformSelectData(_.cloneDeep((segmentControl.value && Array.isArray(segmentControl.value)) ? segmentControl.value : []));
    this.segmentTypeList = this.multiSelectService.getDropdownByArray(this.categories, copySegmentSelected);

    this.checkSegmentTypeValue();
  }

  checkSegmentTypeValue() {
    const segmentControl = this.productForm.get('segment');
    const segmentTypeControl = this.productForm.get('segment_type');
    const checkedValuesList = this.checkNextValues(segmentControl.value, segmentTypeControl.value);
    segmentTypeControl.setValue((checkedValuesList && Array.isArray(checkedValuesList)) ? checkedValuesList : []);
  }

  getPackedGoodsList() {
    const segmentTypeControl = this.productForm.get('segment_type');

    const copySegmentTypeSelected = this.multiSelectService.transformSelectData(_.cloneDeep((segmentTypeControl.value && Array.isArray(segmentTypeControl.value)) ? segmentTypeControl.value : []));
    this.packedGoodsList = this.multiSelectService.getDropdownByArray(this.categories, copySegmentTypeSelected);

    this.checkPackedGoodsValue();
  }

  checkPackedGoodsValue() {
    const segmentTypeControl = this.productForm.get('segment_type');
    const packedGoodsControl = this.productForm.get('packed_goods');
    const checkedValuesList = this.checkNextValues(segmentTypeControl.value, packedGoodsControl.value);
    packedGoodsControl.setValue((checkedValuesList && Array.isArray(checkedValuesList)) ? checkedValuesList : []);
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

  toggleValidatorsLevelOfClearance() {
    const levelOfClearanceControl = this.productForm.get('level_of_clearance');
    if (!levelOfClearanceControl) {
      return false;
    }

    const stageId = this.getStageId();
    const found = this.stageList.find((item) => (item.id === stageId && item.id === this.stageItemIds.FUTURE_DEVELOPMENT));

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
    const stageId = this.getStageId();
    const found = this.stageList.find((item) => (item.id === stageId && item.id === this.stageItemIds.UNDER_DEVELOPMENT));

    if (found) {
      this.productForm.controls.terms_and_limitations.setValidators([Validators.required]);
    } else {
      this.productForm.controls.terms_and_limitations.clearValidators();
    }

    this.productForm.controls.terms_and_limitations.markAsTouched();
    this.productForm.controls.terms_and_limitations.updateValueAndValidity();
  }

  preselectCertificates(backendCertificates: CertificateModel[]) {
    backendCertificates.forEach((certificate: CertificateModel) => {
      const copyCertificate = _.cloneDeep(certificate);
      // filtering certifications by category_id, because it's unique field
      const foundIndex = this.certificates.findIndex(
        (certItem) => ((certItem && certItem.category_id) && (certificate && certificate.category_id) && (certItem.category_id === certificate.category_id))
      );
      if (this.certificates[foundIndex]) {
        this.certificates[foundIndex] = _.merge(
          this.certificates[foundIndex],
          {
            description: copyCertificate.description,
            file_url: copyCertificate.file_url,
            download: copyCertificate.download,
          }
        );
      }
    });
  }

  uploadAllFiles(data: ProductModel) {
    return new Promise((resolve, reject) => {
      const imageQuery = [
        { key: 'itemType', value: 'product' },
        { key: 'fileType', value: 'image' },
      ];
      const pdfConsQuery = [
        { key: 'itemType', value: 'product' },
        { key: 'fileType', value: 'document' },
        { key: 'elementType', value: 'technical-considerations' },
      ];
      const pdfBarrierQuery = [
        { key: 'itemType', value: 'product' },
        { key: 'fileType', value: 'document' },
        { key: 'elementType', value: 'barrier' },
      ];
      const pdfPrintabilityQuery = [
        { key: 'itemType', value: 'product' },
        { key: 'fileType', value: 'document' },
        { key: 'elementType', value: 'printability' },
      ];
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
                      description: data.technical_considerations.description
                    };

              this.uploadAllTdsFiles(data.tds)
                .then((uploadedTdsFiles: any[]) => {
                  data.tds = data.tds.map((tdsItem, index) => {
                    if (uploadedTdsFiles[index].length > 0) {
                      tdsItem.url = uploadedTdsFiles[index][0];
                    } else {
                      tdsItem.url = (tdsItem.url && typeof tdsItem.url === 'string')
                        ? tdsItem.url.split('/').pop()
                        : '';
                    }

                    return tdsItem;
                  });

                  this.uploadAllCollateralsFiles(data.collaterals)
                    .then((uploadedCollateralsFiles: any[]) => {
                      data.collaterals = data.collaterals.map((collateralsItem, index) => {
                        if (uploadedCollateralsFiles[index].length > 0) {
                          collateralsItem.url = uploadedCollateralsFiles[index][0];
                        } else {
                          collateralsItem.url = (collateralsItem.url && typeof collateralsItem.url === 'string')
                            ? collateralsItem.url.split('/').pop()
                            : '';
                        }

                        return collateralsItem;
                      });

                      this.uploadAllMsdsFiles(data.msds)
                        .then((uploadedMsdsFiles: any[]) => {
                          data.msds = data.msds.map((msdsItem, index) => {
                            if (uploadedMsdsFiles[index].length > 0) {
                              msdsItem.url = uploadedMsdsFiles[index][0];
                            } else {
                              msdsItem.url = (msdsItem.url && typeof msdsItem.url === 'string')
                                ? msdsItem.url.split('/').pop()
                                : '';
                            }

                            return msdsItem;
                          });

                          this.fileService
                            .uploadAllNewImages(
                              this.checkBackendBarrier === true || !this.getBarrierFile
                                ? []
                                : [this.getBarrierFile],
                              pdfBarrierQuery
                            )
                            .then((barrierFile: string[]) => {
                              data.barrier = (barrierFile.length > 0)
                                ? {
                                  url: barrierFile[0],
                                  description: data.barrier.description,
                                }
                                : this.checkBackendBarrier === true && this.getBarrierFile
                                  ? {
                                    url: this.getBarrierFile.split('/').pop(),
                                    description: data.barrier.description,
                                  }
                                  : {
                                    url: null,
                                    description: data.barrier.description
                                  };

                              this.fileService
                                .uploadAllNewImages(
                                  this.checkBackendPrintability === true || !this.getPrintabilityFile
                                    ? []
                                    : [this.getPrintabilityFile],
                                  pdfPrintabilityQuery
                                )
                                .then((printabilityFile: string[]) => {
                                  data.printability = (printabilityFile.length > 0)
                                    ? {
                                      url: printabilityFile[0],
                                      description: data.printability.description,
                                    }
                                    : this.checkBackendPrintability === true && this.getPrintabilityFile
                                      ? {
                                        url: this.getPrintabilityFile.split('/').pop(),
                                        description: data.printability.description,
                                      }
                                      : {
                                        url: null,
                                        description: data.printability.description
                                      };

                                  this.uploadAllCertificates(data.certifications)
                                    .then((uploadedCertificateFiles: any[]) => {
                                      data.certifications = data.certifications.map((certificate, index) => {
                                        if (uploadedCertificateFiles[index].length > 0) {
                                          certificate.file_url =
                                            uploadedCertificateFiles[index][0];
                                        } else {
                                          certificate.file_url = (certificate.file_url && typeof certificate.file_url === 'string')
                                            ? certificate.file_url.split('/').pop()
                                            : null;
                                        }

                                        return certificate;
                                      });

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
        })
        .catch((err) => {
          reject(err);
        });
    });
  }

  uploadAllCertificates(certificates: CertificateModel[]) {
    const query = [
      { key: 'itemType', value: 'product' },
      { key: 'fileType', value: 'document' },
      { key: 'elementType', value: 'certificates' },
    ];

    const files = certificates.map((item) => {
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

  uploadAllTdsFiles(tdsList: TdsModel[]) {
    const pdfTdsQuery = [
      { key: 'itemType', value: 'product' },
      { key: 'fileType', value: 'document' },
      { key: 'elementType', value: 'tds' },
    ];

    const files = tdsList.map((item) => {
      if (!item.url || typeof item.url === 'string') {
        return [];
      } else {
        return [item.url];
      }
    });

    return Promise.all(
      files.map((file) => {
        return this.fileService.uploadAllNewImages(file, pdfTdsQuery);
      })
    );
  }

  uploadAllCollateralsFiles(collateralsList: CollateralsModel[]) {
    const pdfCollateralsQuery = [
      { key: 'itemType', value: 'product' },
      { key: 'fileType', value: 'document' },
      { key: 'elementType', value: 'collaterals' },
    ];

    const files = collateralsList.map((item) => {
      if (!item.url || typeof item.url === 'string') {
        return [];
      } else {
        return [item.url];
      }
    });

    return Promise.all(
      files.map((file) => {
        return this.fileService.uploadAllNewImages(file, pdfCollateralsQuery);
      })
    );
  }

  uploadAllMsdsFiles(msdsList: TdsModel[]) {
    const pdfMsdsQuery = [
      { key: 'itemType', value: 'product' },
      { key: 'fileType', value: 'document' },
      { key: 'elementType', value: 'msds' },
    ];

    const files = msdsList.map((item) => {
      if (!item.url || typeof item.url === 'string') {
        return [];
      } else {
        return [item.url];
      }
    });

    return Promise.all(
      files.map((file) => {
        return this.fileService.uploadAllNewImages(file, pdfMsdsQuery);
      })
    );
  }

  addTdsFile(files: FileList, controlName) {
    this.productForm.get(controlName).patchValue({ url: files[0] });
  }

  deleteTdsFile(controlName) {
    this.productForm.get(controlName).get('url').reset();
  }

  get getSelectedCertificates() {
    return this.certificates
      .filter((item) => (item.description || item.file_url)) // Certeficate with description or file
      .map((item: CertificateModel) => {
        return {
          category_id: item.category_id,
          description: item.description,
          file_url: item.file_url,
          download: item.download,
        };
      });
  }

  get getTechnicalConsiderationFile() {
    return this.productForm.get('technical_considerations').get('url').value;
  }

  get getBarrierFile() {
    return this.productForm.get('barrier').get('url').value;
  }

  get getPrintabilityFile() {
    return this.productForm.get('printability').get('url').value;
  }

  get checkBackendConsideration() {
    return (
      typeof this.productForm.get('technical_considerations').get('url')
        .value === 'string'
    );
  }

  get checkBackendBarrier() {
    return (typeof this.productForm.get('barrier').get('url').value === 'string');
  }

  get checkBackendPrintability() {
    return (typeof this.productForm.get('printability').get('url').value === 'string');
  }

  get getWidth(): FormArray {
    return this.productForm.get('width') as FormArray;
  }

  get getMOQ(): FormArray {
    return this.productForm.get('moqArray') as FormArray;
  }

  get getCertificatesArray(): FormArray {
    return (this.productForm) ? this.productForm?.get('certificates') as FormArray : null;
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
    const certificateId: number = (typeof certificate?.certificate_id === 'number') ? certificate?.certificate_id : null;
    const certificateCategory: CategoryModel = (certificateId) ? this.categories.find(item => item?.id === certificateId) : null;
    const certifiedByCategory: CategoryModel = (certificateCategory) ? this.certifiedByList.find(item => item?.id === certificateCategory?.metadata?.certificate_certified_by) : null;

    const preselectCertifiedBy: CategoryModel[] = (certifiedByCategory) ? [certifiedByCategory] : [];
    const preselectCertificateValueList: CategoryModel[] = (certificateCategory) ? [certificateCategory] : [];
    const preselectDownloadGraphics: boolean = (certificate?.download_graphics) ? certificate?.download_graphics : false;
    const preselectNotes: string = (typeof certificate?.notes === 'string') ? certificate?.notes : '';
    const preselectThickness: (number | string)[] = (Array.isArray(certificate?.thickness)) ? certificate?.thickness : [];

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
    const certifiedByListParent: CategoryModel = (this.categories)
      ? this.categories.find((category) => (category.title === CERTIFIED_BY.title && category.level === CERTIFIED_BY.level))
      : null;

    // GET certifiedByList
    this.certifiedByList = (certifiedByListParent)
      ? this.multiSelectService.getDropdownById(this.categories, certifiedByListParent.id)
      : [];
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

  getAvailableInThisTerritoriesList() {
    const AVAILABLE_TERRITORIES = AppConstants.MainCategoryNames.TERRITORIES;
    const availableInThisTerritoriesList: CategoryModel = (this.categories)
      ? this.categories.find((category) => (category.title === AVAILABLE_TERRITORIES.title && category.level === AVAILABLE_TERRITORIES.level))
      : null;

    // GET availableInThisTerritoriesList
    this.availableInThisTerritoriesList = (availableInThisTerritoriesList)
      ? this.multiSelectService.getDropdownById(this.categories, availableInThisTerritoriesList.id)
      : [];
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

  getMeasureUnitList() {
    const MEASURE_UNIT = AppConstants.MainCategoryNames.MEASURE_UNIT;
    const measureUnitList: CategoryModel = (this.categories)
      ? this.categories.find((category) => (category.title === MEASURE_UNIT.title && category.level === MEASURE_UNIT.level))
      : null;

    // GET MEASURE UNIT
    this.measureUnitList = (measureUnitList)
      ? this.multiSelectService.getDropdownById(this.categories, measureUnitList.id)
      : [];
  }

  getAvailableProductCertificatesList() {
    const CERTIFICATES = AppConstants.MainCategoryNames.CERTIFICATES;
    const certificatesParent: CategoryModel = (this.categories)
      ? this.categories.find((category) => (category.title === CERTIFICATES.title && category.level === CERTIFICATES.level))
      : null;

    const allCertificatesList: CategoryModel[] = (certificatesParent)
      ? this.multiSelectService.getDropdownById(this.categories, certificatesParent.id)
      : [];

    this.availableProductCertificatesList = allCertificatesList.filter(categoryItem => {
      const certificateAvailableForIds = AppConstants.CertificateAvailableForIds;
      const isAvailable: boolean = (Array.isArray(categoryItem?.metadata?.certificate_available_for))
        ? Boolean(categoryItem?.metadata?.certificate_available_for.find(id => id === certificateAvailableForIds.PRODUCTS))
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
    list = _.uniqWith(list, _.isEqual); // unique items
    list = _.sortBy(list); // sort items

    // Available thickness
    const nameAllThickness: string = AppConstants.CertificateThicknessNames.ALL_THICKNESS;
    this.availableCertificateThicknessList = (Array.isArray(list)) ? [nameAllThickness, ...list] : [nameAllThickness];

    // Check and preselect thickness
    this.getCertificatesArray.controls.map(itemControl => {
      const thicknessControl = itemControl?.get('thickness');
      const thicknessValue: (number | string)[] = (thicknessControl && Array.isArray(thicknessControl?.value))
        ? thicknessControl?.value || []
        : [];

      if (thicknessControl) {
        const preselectThicknessValue: (number | string)[] = thicknessValue.filter(item => this.availableCertificateThicknessList.find(item2 => item === item2));
        thicknessControl.setValue(preselectThicknessValue, { emitEvent: false });
      }

      return itemControl;
    });
  }

  getTransformedCertificates(certificates: any[]): CertificatesModel[] {
    const transformedCertificates: CertificatesModel[] = (Array.isArray(certificates) && certificates.length)
      ? certificates.map(item => {
        const certificateIdValue: number = (Array.isArray(item?.certificate?.value_list) && item?.certificate?.value_list?.length) ? item?.certificate?.value_list[0].id : null; // [0] because, single select
        const downloadGraphicsValue: boolean = (typeof item?.download_graphics === 'boolean') ? item?.download_graphics : false;
        const notesValue: string = (item?.notes && typeof item?.notes === 'string') ? item?.notes : '';
        const thicknessValue: (number | string)[] = (Array.isArray(item?.thickness)) ? item?.thickness : [];

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

  addWidthItem() {
    this.getWidth.push(
      new FormGroup({
        min: new FormControl(null),
        max: new FormControl(null),
        stage: new FormControl(null),
        measure_unit: new FormControl(null),
      })
    );
  }

  addMOQItem() {
    this.getMOQ.push(
      new FormGroup({
        moq: new FormControl(null, [Validators.required]),
        measure_unit: new FormControl(null),
        notes: new FormControl(null),
        stage: new FormControl(null)
      })
    );
  }

  removeWidthItem(index: number) {
    this.getWidth.removeAt(index);
  }

  setFieldStatus(selectField: SelectFieldEnum) {
    switch (selectField) {
      case this.selectFieldEnum.additionalFeatures:
        break;
    }
  }

  addField(selectField: SelectFieldEnum) {
    switch (selectField) {
      case this.selectFieldEnum.additionalFeatures:
        this.additionalFeaturesFieldList.push({
          ids: [],
          stage: null,
          mandatory: false
        });
        break;
      case this.selectFieldEnum.collaterals:
        this.collateralsFieldList.push({
          url: '',
        });
        break;
      case this.selectFieldEnum.tds:
        this.tdsFieldList.push({
          url: '',
        });
        break;
      case this.selectFieldEnum.msds:
        this.msdsFieldList.push({
          url: '',
        });
        break;
    }
  }

  deleteField(selectField: SelectFieldEnum, itemField) {
    switch (selectField) {
      case this.selectFieldEnum.additionalFeatures:
        if (this.additionalFeaturesFieldList.length === 1) {
          return false;
        }
        this.additionalFeaturesFieldList = this.additionalFeaturesFieldList.filter((item) => (item != itemField));
        break;
      case this.selectFieldEnum.collaterals:
        this.collateralsFieldList = this.collateralsFieldList.filter((item) => (item != itemField));
        // add default item, when array is empty
        if (this.collateralsFieldList.length === 0) {
          this.addField(this.selectFieldEnum.collaterals);
        }
        break;
      case this.selectFieldEnum.tds:
        this.tdsFieldList = this.tdsFieldList.filter((item) => (item != itemField));
        // add default item, when array is empty
        if (this.tdsFieldList.length === 0) {
          this.addField(this.selectFieldEnum.tds);
        }
        break;
      case this.selectFieldEnum.msds:
        this.msdsFieldList = this.msdsFieldList.filter((item) => (item != itemField));
        // add default item, when array is empty
        if (this.msdsFieldList.length === 0) {
          this.addField(this.selectFieldEnum.msds);
        }
        break;
    }
  }

  getTypeofNumber(value): boolean {
    return (typeof value === 'number' && value >= 0);
  }

  get getFoodCertificates() {
    return this.certificates.filter((item) => (item && item.type && item.type === AppConstants.CertificationTypeNames.FOOD));
  }

  get getIndustrialCertificates() {
    return this.certificates.filter((item) => (item && item.type && item.type === AppConstants.CertificationTypeNames.INDUSTRIAL));
  }

  get getHomeCertificates() {
    return this.certificates.filter((item) => (item && item.type && item.type === AppConstants.CertificationTypeNames.HOME));
  }
}
