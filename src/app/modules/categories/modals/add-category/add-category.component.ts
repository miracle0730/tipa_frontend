import { Component, OnInit, OnDestroy } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { BsModalRef } from 'ngx-bootstrap/modal';
import {
  FormGroup,
  FormBuilder,
  FormControl,
  Validators,
  FormArray,
} from '@angular/forms';
import { AlertService, CategoryService, ThicknessService, MultiSelectService, FileService, } from '@services';
import { CategoryModel, CategoryMetadataModel, MetadataHintModel, ThicknessModel, FilmGradeModel, CertificationTypeModel, PhotosResponse, } from '@models';
import { IDropdownSettings } from 'ng-multiselect-dropdown';
import { AppConstants } from '@core/app.constants';
import { Subscription } from 'rxjs';
import { map } from 'rxjs/operators';
import * as _ from 'lodash';
import { Store } from '@ngrx/store';
import * as fromApp from '@store/app.reducer';
import * as CategoryActions from '@store/category/category.actions';
import * as ThicknessActions from '@store/thickness/thickness.actions';

export interface InitialState {
  status: string; // Category | Thickness
  elementInfo: ParentCategoryInfo | any;
}

export interface ParentCategoryInfo {
  parent_id: number;
  level: number;
}

@Component({
  selector: 'app-add-category',
  templateUrl: './add-category.component.html',
  styleUrls: ['./add-category.component.scss'],
})
export class AddCategoryComponent implements OnInit, OnDestroy {
  public categoriesSubscription: Subscription;

  public categories: CategoryModel[] = [];

  // Metadata's fields
  public showMetadataHints: boolean;
  public showMetadataFilmGrade: boolean;
  public filmGradeList: FilmGradeModel[] = [...AppConstants.FilmGradeList];
  public showMetadataCertificationType: boolean;
  public certificationTypeList: CertificationTypeModel[] = [...AppConstants.CertificationTypeList];
  public showMetadataCertificationLogo: boolean;
  public certificationLogos: File[] = [];
  public showMetadataCertificationFile: boolean;
  public certificationFile: File = null;
  // application_type
  public applicationTypeDisplayPriorityList: number[] = _.cloneDeep(AppConstants.DisplayPriorityList);
  public showMetadataApplicationTypeLogo: boolean;
  public applicationTypeLogos: File[] = [];
  // product_family
  public productFamilyDisplayPriorityList: number[] = _.cloneDeep(AppConstants.DisplayPriorityList);
  public showMetadataProductFamilyLogo: boolean;
  public productFamilyLogos: File[] = [];

  public addCategoryForm: FormGroup;
  public controlTitleIsNumber: boolean;
  public initialState: InitialState;

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

  public certificationTypeDropdownSettings: IDropdownSettings = {
    singleSelection: true,
    idField: 'type',
    textField: 'title',
    itemsShowLimit: 1,
    allowSearchFilter: false,
    enableCheckAll: false,
    closeDropDownOnSelection: true,
  };

  constructor(
    private store: Store<fromApp.AppState>,
    private bsModalRef: BsModalRef,
    private formBuilder: FormBuilder,
    private categoryService: CategoryService,
    private alertService: AlertService,
    private thicknessService: ThicknessService,
    private multiSelectService: MultiSelectService,
    private fileService: FileService,
  ) {
    this.addCategoryForm = this.formBuilder.group({
      title: new FormControl('', [Validators.required]),
      metadata: new FormGroup({}),
    });
  }

  ngOnInit() {
    this.getCategories();
    this.checkStatus();
  }

  ngOnDestroy() {
    if (this.categoriesSubscription) {
      this.categoriesSubscription.unsubscribe();
    }
  }

  checkStatus() {
    switch(this.initialState.status.toLowerCase()) {
      case 'Category'.toLowerCase():
        this.addCategoryForm.addControl('level', new FormControl(''));
        this.addCategoryForm.addControl('parent_id', new FormControl(''));
        break;
      case 'Thickness'.toLowerCase():
        break;
      default:
        console.error('Status (Category | Thickness) is not a match !!!');
        break;
    }

    this.addCategoryForm.patchValue(this.initialState.elementInfo);
  }

  getCategories() {
    this.categoriesSubscription = this.store
      .select('categories')
      .pipe(map((categoryState) => categoryState.categories))
      .subscribe((categories: CategoryModel[]) => {
        this.categories = categories;

        this.getProductFamily();
        this.getApplicationType();
        this.getAdditionalFeatures();
        this.getCore();
        this.getSegments();
        this.getCompostabilityLogos();
        this.getFoodContacts();
      });
  }

  getAdditionalFeatures() {
    const ADDITIONAL_FEATURES = AppConstants.MainCategoryNames.ADDITIONAL_FEATURES;
    let additionalFeaturesParent = this.categories
      .find((item) => (item.title === ADDITIONAL_FEATURES.title && item.level === ADDITIONAL_FEATURES.level) );

    if (additionalFeaturesParent) {
      let secondLevelList = this.multiSelectService.getDropdownById(this.categories, additionalFeaturesParent.id);

      // Additional feature category with level 3
      let elementInfo = (this.initialState && this.initialState.elementInfo) ? this.initialState.elementInfo : null;
      if (elementInfo && elementInfo.hasOwnProperty('parent_id') && elementInfo.hasOwnProperty('level')) { // This is category
        const level = 3;
        let foundParent = secondLevelList.find(item => (item.id === elementInfo.parent_id));

        if (foundParent && elementInfo.level === level) {
          this.showMetadataHints = true;
          this.getMetadata.addControl('hints', new FormArray([])); // new empty control
          this.addHint(); // first by default
        }
      }
    }
  }

  getCore() {
    let elementInfo = (this.initialState && this.initialState.hasOwnProperty('elementInfo')) ? this.initialState.elementInfo : null;

    // NOT a category
    if (!elementInfo || !elementInfo.hasOwnProperty('parent_id') || !elementInfo.hasOwnProperty('level')) {
      return false;
    }

    const CORE = AppConstants.MainCategoryNames.CORE;
    let coreParent: CategoryModel = this.categories
      .find((item) => (item.title === CORE.title && item.level === CORE.level) );

    if (coreParent && coreParent.id === elementInfo.parent_id && elementInfo.level === 2) { // Core category with level 2
      this.controlTitleIsNumber = true; // title input is number
    }
  }

  getSegments() {
    const elementInfo = (this.initialState && this.initialState.elementInfo) ? this.initialState.elementInfo : null;

    // NOT a category
    if (!elementInfo || !elementInfo.hasOwnProperty('parent_id') || !elementInfo.hasOwnProperty('level')) {
      return false;
    }

    const SEGMENTS = AppConstants.MainCategoryNames.SEGMENTS;
    let segmentsParent: CategoryModel = this.categories
      .find((item) => (item.title === SEGMENTS.title && item.level === SEGMENTS.level) );

    if (segmentsParent) {
      // Segments
      let secondLevelList = this.multiSelectService.getDropdownById(this.categories, segmentsParent.id);

      // Sub Segments
      let thirdLevelList = secondLevelList.map((parent) => this.multiSelectService.getDropdownById(this.categories, parent.id) );
      let mergedThirdLevelList: CategoryModel[] = [];
      thirdLevelList.map(arr => mergedThirdLevelList.push(...arr) );

      // parents
      let foundParentPackedGoods: CategoryModel = mergedThirdLevelList.find(item => (item.id === elementInfo.parent_id));
      let foundParentSegmentTypes: CategoryModel = (foundParentPackedGoods)
        ? secondLevelList.find(item => (item.id === foundParentPackedGoods.parent_id))
        : null;
      let packedGoodslevel: number = 4;

      // NEW packed good
      if (foundParentPackedGoods && elementInfo.level === packedGoodslevel) {
        this.showMetadataFilmGrade = true;
        this.getMetadata.addControl('film_grade', new FormControl([], [Validators.required])); // new empty control

        // SET default value
        if (foundParentSegmentTypes && foundParentPackedGoods) {
          let segmentFood: string = 'Food';
          let segmentTypeDryFood: string = 'Dry Food';
          let others: string = 'Non Food';

          if (foundParentSegmentTypes.title.includes(segmentFood)) {
            if (foundParentPackedGoods.title.includes(segmentTypeDryFood)) {
              let foundDryFood: FilmGradeModel = this.filmGradeList.find(item => item.id === 2); // Dry Food
              this.getMetadata.get('film_grade').setValue((foundDryFood) ? [foundDryFood] : [], {emitEvent: false});
            } else {
              let foundFoodGrade: FilmGradeModel = this.filmGradeList.find(item => item.id === 1); // Food grade
              this.getMetadata.get('film_grade').setValue((foundFoodGrade) ? [foundFoodGrade] : [], {emitEvent: false});
            }
          } else {
            let foundNonFood: FilmGradeModel = this.filmGradeList.find(item => item.id === 3); // Non food
            this.getMetadata.get('film_grade').setValue((foundNonFood) ? [foundNonFood] : [], {emitEvent: false});
          }
        }
      }
    }
  }

  getFoodContacts() {
    const elementInfo = (this.initialState && this.initialState.elementInfo) ? this.initialState.elementInfo : null;

    // NOT a category
    if (!elementInfo || !elementInfo.hasOwnProperty('parent_id') || !elementInfo.hasOwnProperty('level')) {
      return false;
    }

    const FOOD_CONTACTS = AppConstants.MainCategoryNames.FOOD_CONTACTS;
    let foodContactsParent = this.categories
      .find((item) => (item.title === FOOD_CONTACTS.title && item.level === FOOD_CONTACTS.level) );

    if (foodContactsParent) {
      // Second level - Certification types
      let secondLevel: number = 2;
      let foundItemSecondLevel: boolean = (elementInfo.parent_id === foodContactsParent.id && elementInfo.level === secondLevel);

      if (foundItemSecondLevel) {
        // certification_type field
        this.showMetadataCertificationType = true;
        this.certificationTypeList = this.certificationTypeList.filter(certItem => certItem.type === AppConstants.CertificationTypeNames.FOOD); // only FOOD item
        let foundFoodItem = this.certificationTypeList.find(certItem => certItem.type === AppConstants.CertificationTypeNames.FOOD); // autoselect FOOD item
        this.getMetadata.addControl('certification_type', new FormControl((foundFoodItem) ? [foundFoodItem] : [], [Validators.required])); // new empty control
      }
    }
  }

  getProductFamily() {
    const elementInfo = (this.initialState && this.initialState.elementInfo) ? this.initialState.elementInfo : null;

    // NOT a category
    if (!elementInfo || !elementInfo.hasOwnProperty('parent_id') || !elementInfo.hasOwnProperty('level')) {
      return false;
    }

    const PRODUCT_FAMILY = AppConstants.MainCategoryNames.PRODUCT_FAMILY;
    let productFamilyParent = this.categories
      .find((item) => (item.title === PRODUCT_FAMILY.title && item.level === PRODUCT_FAMILY.level) );

    if (productFamilyParent) {
      // Second level
      let secondLevel: number = 2;
      let foundItemSecondLevel: boolean = (elementInfo.parent_id === productFamilyParent.id && elementInfo.level === secondLevel);

      if (foundItemSecondLevel) {
        // product_family_logo field
        this.showMetadataProductFamilyLogo = true;
        this.getMetadata.addControl('product_family_logo', new FormControl('')); // new empty control

        // product_family_display_priority field
        this.getMetadata.addControl('product_family_display_priority', new FormControl([])); // new empty control
      }
    }
  }

  addProductFamilyLogoEvent(images: PhotosResponse) {
    this.productFamilyLogos = (images && images.newImages) ? images.newImages : [];
  }

  getApplicationType() {
    const elementInfo = (this.initialState && this.initialState.elementInfo) ? this.initialState.elementInfo : null;

    // NOT a category
    if (!elementInfo || !elementInfo.hasOwnProperty('parent_id') || !elementInfo.hasOwnProperty('level')) {
      return false;
    }

    const APPLICATION_TYPE = AppConstants.MainCategoryNames.APPLICATION_TYPE;
    let applicationTypeParent = this.categories
      .find((item) => (item.title === APPLICATION_TYPE.title && item.level === APPLICATION_TYPE.level) );

    if (applicationTypeParent) {
      // Second level
      let secondLevel: number = 2;
      let foundItemSecondLevel: boolean = (elementInfo.parent_id === applicationTypeParent.id && elementInfo.level === secondLevel);

      if (foundItemSecondLevel) {
        // application_type_logo field
        this.showMetadataApplicationTypeLogo = true;
        this.getMetadata.addControl('application_type_logo', new FormControl('')); // new empty control

        // application_type_display_priority field
        this.getMetadata.addControl('application_type_display_priority', new FormControl([])); // new empty control
      }
    }
  }

  addApplicationTypeLogoEvent(images: PhotosResponse) {
    this.applicationTypeLogos = (images && images.newImages) ? images.newImages : [];
  }

  getCompostabilityLogos() {
    const elementInfo = (this.initialState && this.initialState.elementInfo) ? this.initialState.elementInfo : null;

    // NOT a category
    if (!elementInfo || !elementInfo.hasOwnProperty('parent_id') || !elementInfo.hasOwnProperty('level')) {
      return false;
    }

    const COMPOSTABILITY_LOGOS = AppConstants.MainCategoryNames.COMPOSTABILITY_LOGOS;
    let compostabilityLogosParent = this.categories
      .find((item) => (item.title === COMPOSTABILITY_LOGOS.title && item.level === COMPOSTABILITY_LOGOS.level) );

    if (compostabilityLogosParent) {
      // Second level - Certification types
      let secondLevelList: CategoryModel[] = this.multiSelectService.getDropdownById(this.categories, compostabilityLogosParent.id);
      let secondLevel: number = 2;
      let foundItemSecondLevel: boolean = (elementInfo.parent_id === compostabilityLogosParent.id && elementInfo.level === secondLevel);

      if (foundItemSecondLevel) {
        // certification_type field
        this.showMetadataCertificationType = true;
        this.certificationTypeList = this.certificationTypeList.filter(certItem => certItem.type !== AppConstants.CertificationTypeNames.FOOD); // without FOOD item
        this.getMetadata.addControl('certification_type', new FormControl([], [Validators.required])); // new empty control

        // certification_logo field
        this.showMetadataCertificationLogo = true;
        this.getMetadata.addControl('certification_logo', new FormControl('', [Validators.required])); // new empty control
      }

      // Third level
      let thirdLevel: number = 3;
      let foundItemThirdLevel = secondLevelList.find(item => elementInfo.parent_id === item.id && elementInfo.level === thirdLevel);
      if (foundItemThirdLevel) {
        // certification_file field
        this.showMetadataCertificationFile = true;
        this.getMetadata.addControl('certification_file', new FormControl('', [Validators.required])); // new empty control
      }
    }
  }

  validCertificationFile() {
    let control = this.getMetadata.get('certification_file');
    if (!control) { return false; }

    if (this.certificationFile) {
      control.clearValidators();
    } else {
      control.setValidators([Validators.required]);
    }
    control.updateValueAndValidity();
    control.markAllAsTouched();
  }

  addCertificationFile(files: FileList) {
    this.certificationFile = files[0];
    this.validCertificationFile();
  }

  deleteCertificationFile() {
    this.certificationFile = null;
    this.validCertificationFile();
  }

  validCertificationLogo() {
    let control = this.getMetadata.get('certification_logo');
    if (!control) { return false; }

    if (this.certificationLogos && this.certificationLogos.length) {
      control.clearValidators();
    } else {
      control.setValidators([Validators.required]);
    }
    control.updateValueAndValidity();
    control.markAllAsTouched();
  }

  addCompostabilityLogoEvent(images: PhotosResponse) {
    this.certificationLogos = (images && images.newImages) ? images.newImages : [];
    this.validCertificationLogo();
  }

  uploadAllPhotosAndDocuments(data) {
    return new Promise((resolve, reject) => {
      const certificatesImageQuery = [
        { key: 'itemType', value: 'certificates' },
        { key: 'fileType', value: 'image' },
      ];
      const certificatesFileQuery = [
        { key: 'itemType', value: 'certificates' },
        { key: 'fileType', value: 'document' },
      ];
      const applicationTypeImageQuery = [
        { key: 'itemType', value: 'application-type' },
        { key: 'fileType', value: 'image' },
      ];
      const productFamilyImageQuery = [
        { key: 'itemType', value: 'product-family' },
        { key: 'fileType', value: 'image' },
      ];

      // certification_logo
      this.fileService.uploadAllNewImages(this.certificationLogos, certificatesImageQuery)
        .then((images: string[]) => {
          if (this.showMetadataCertificationLogo) { // when certification_logo is visible
            data.metadata.certification_logo = (images && images.length) ? images[0] : ''; // get first item, because it's single logo
          }

          // certification_file
          this.fileService.uploadAllNewImages(
              (this.certificationFile) ? [this.certificationFile] : [],
              certificatesFileQuery
            )
            .then((resCertFile: string[]) => {
              if (this.showMetadataCertificationFile) { // when certification_file is visible
                data.metadata.certification_file = (resCertFile && resCertFile.length) ? resCertFile[0] : ''; // get first item, because it's single file
              }

              // application_type_logo
              this.fileService.uploadAllNewImages(this.applicationTypeLogos, applicationTypeImageQuery)
                .then((resApplicationTypeLogos: string[]) => {
                  if (this.showMetadataApplicationTypeLogo) { // when application_type_logo is visible
                    data.metadata.application_type_logo = (resApplicationTypeLogos && resApplicationTypeLogos.length) ? resApplicationTypeLogos[0] : ''; // get first item, because it's single logo
                  }

                  // product_family_logo
                  this.fileService.uploadAllNewImages(this.productFamilyLogos, productFamilyImageQuery)
                    .then((resProductFamilyLogos: string[]) => {
                      if (this.showMetadataProductFamilyLogo) { // when product_family_logo is visible
                        data.metadata.product_family_logo = (resProductFamilyLogos && resProductFamilyLogos.length) ? resProductFamilyLogos[0] : ''; // get first item, because it's single logo
                      }

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
    });
  }

  add() {
    switch(this.initialState.status.toLowerCase()) {
      case 'Category'.toLowerCase():
        this.addCategory();
        break;
      case 'Thickness'.toLowerCase():
        this.addThickness();
        break;
      default:
        console.error('Status (Category | Thickness) is not a match !!!');
        break;
    }
  }

  addCategory() {
    let data = _.cloneDeep(this.addCategoryForm.value);
    data.title = String(data.title);

    // transform data
    if (data.metadata) {
      if (data.metadata.hints) {
        data.metadata.hints = data.metadata.hints.filter((hintItem: MetadataHintModel) => hintItem.title);
      }
      if (data.metadata.hasOwnProperty('film_grade')) {
        data.metadata.film_grade = (data.metadata.film_grade && data.metadata.film_grade.length)
          ? data.metadata.film_grade[0].id // single select
          : null;
      }
      if (data.metadata.hasOwnProperty('certification_type')) {
        data.metadata.certification_type = (data.metadata.certification_type && data.metadata.certification_type.length)
          ? data.metadata.certification_type[0].type // single select
          : '';
      }

      if (data?.metadata?.hasOwnProperty('product_family_display_priority')) {
        let value: number = (Array.isArray(data?.metadata?.product_family_display_priority) && data?.metadata?.product_family_display_priority?.length)
          ? data?.metadata?.product_family_display_priority[0] || null // single select
          : null;
        data.metadata.product_family_display_priority = value;
      }

      if (data?.metadata?.hasOwnProperty('application_type_display_priority')) {
        let value: number = (Array.isArray(data?.metadata?.application_type_display_priority) && data?.metadata?.application_type_display_priority?.length)
          ? data?.metadata?.application_type_display_priority[0] || null // single select
          : null;
        data.metadata.application_type_display_priority = value;
      }
    }

    // upload files and transform data
    this.uploadAllPhotosAndDocuments(data)
      .then((resData) => {
        // add new category
        this.categoryService.addCategory(resData).subscribe(
          (category: CategoryModel) => {
            this.alertService.showSuccess('Successfully added!');
            this.store.dispatch(new CategoryActions.AddCategory(category));
            this.closeModal();
          },
          (err: HttpErrorResponse) => {
            this.alertService.showError(err.error.message);
          }
        );
      })
      .catch((err) => {
        this.alertService.showError('');
      });
  }

  addThickness() {
    let body = {
      value: parseInt(this.addCategoryForm.value.title)
    };

    this.thicknessService.addThickness(body).subscribe(
      (thickness: ThicknessModel) => {
        this.alertService.showSuccess('Successfully added!');
        this.store.dispatch(new ThicknessActions.AddThickness(thickness));
        this.closeModal();
      },
      (err: HttpErrorResponse) => {
        this.alertService.showError(err.error.message);
      }
    );
  }

  addHint(defaultTitle?: string) {
    const hint = new FormGroup({
      title: new FormControl(defaultTitle ? defaultTitle : ''),
    });
    this.getMetadataHints.push(hint);
  }

  deleteHint(index: number) {
    this.getMetadataHints.removeAt(index);
  }

  get getMetadata() {
    return this.addCategoryForm.get('metadata') as FormGroup;
  }

  get getMetadataHints(): FormArray {
    if (!this.getMetadata.contains('hints')) { return null; }

    return this.getMetadata.get('hints') as FormArray;
  }

  closeModal() {
    this.bsModalRef.hide();
  }
}
