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
import { AlertService, CategoryService, ThicknessService, MultiSelectService, FileService } from '@services';
import { CategoryModel, CategoryMetadataModel, MetadataHintModel, ThicknessModel, FilmGradeModel, CertificationTypeModel, PhotosResponse, ImageModel, } from '@models';
import { IDropdownSettings } from 'ng-multiselect-dropdown';

import { Store } from '@ngrx/store';
import * as fromApp from '@store/app.reducer';
import * as CategoryActions from '@store/category/category.actions';
import * as ThicknessActions from '@store/thickness/thickness.actions';

import { AppConstants } from '@core/app.constants';

import { Subscription } from 'rxjs';
import { map } from 'rxjs/operators';

import * as _ from 'lodash';

@Component({
  selector: 'app-edit-category',
  templateUrl: './edit-category.component.html',
  styleUrls: ['./edit-category.component.scss'],
})
export class EditCategoryComponent implements OnInit, OnDestroy {
  public categoriesSubscription: Subscription;

  public categories: CategoryModel[] = [];

  // Metadata's fields
  public showMetadataHints: boolean;
  public showMetadataFilmGrade: boolean;
  public filmGradeList: FilmGradeModel[] = [...AppConstants.FilmGradeList];
  public showMetadataCertificationType: boolean;
  public certificationTypeList: CertificationTypeModel[] = [...AppConstants.CertificationTypeList];
  public showMetadataCertificationLogo: boolean;
  public certificationLogosNew: File[] = [];
  public certificationLogosOld: ImageModel[] = [];
  public showMetadataCertificationFile: boolean;
  public certificationFileNew: File = null;
  public certificationFileOld: ImageModel = null;
  // application_type
  public applicationTypeDisplayPriorityList: number[] = _.cloneDeep(AppConstants.DisplayPriorityList);
  public showMetadataApplicationTypeLogo: boolean;
  public applicationTypeLogoNew: File[] = [];
  public applicationTypeLogoOld: ImageModel[] = [];
  // product_family
  public productFamilyDisplayPriorityList: number[] = _.cloneDeep(AppConstants.DisplayPriorityList);
  public showMetadataProductFamilyLogo: boolean;
  public productFamilyLogoNew: File[] = [];
  public productFamilyLogoOld: ImageModel[] = [];

  public editCategoryForm: FormGroup;
  public controlTitleIsNumber: boolean;

  public status: string; // Category | Thickness
  public item: any; // CategoryModel | ThicknessModel
  public itemId: number;
  public itemTitle: string | number;

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
    this.editCategoryForm = this.formBuilder.group({
      title: new FormControl('', Validators.required),
      metadata: new FormGroup({}),
    });
  }

  ngOnInit() {
    this.getCategories();

    if (this.itemTitle) {
      this.editCategoryForm.get('title').setValue(this.itemTitle);
    }
  }
  
  ngOnDestroy() {
    if (this.categoriesSubscription) {
      this.categoriesSubscription.unsubscribe();
    }
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

      let thirdLevelList = secondLevelList.map((parent) => {
        return this.multiSelectService.getDropdownById(this.categories, parent.id);
      });

      let mergedThirdLevelList: CategoryModel[] = [];
      thirdLevelList.map(arr => mergedThirdLevelList.push(...arr) );

      // Additional feature category with level 3
      if (this.item && this.item.hasOwnProperty('id') && this.item.hasOwnProperty('level')) { // This is category
        const level = 3;
        let found = mergedThirdLevelList.find(item => (item.id === this.item.id && item.level === this.item.level));

        if (found && this.item.level === level) {
          this.showMetadataHints = true;
          this.getMetadata.addControl('hints', new FormArray([])); // new empty control

          if (this.item.hasOwnProperty('metadata') && this.item.metadata.hasOwnProperty('hints')) {
            this.item.metadata.hints.map((hintItem: MetadataHintModel) => this.addHint(hintItem.title) );
          } else {
            this.addHint(); // first by default
          }
        }
      }
    }
  }

  getCore() {
    // NOT a category
    if (!this.item || !this.item.hasOwnProperty('parent_id') || !this.item.hasOwnProperty('level') || !this.item.hasOwnProperty('title')) {
      return false;
    }

    const CORE = AppConstants.MainCategoryNames.CORE;
    let coreParent: CategoryModel = this.categories
      .find((item) => (item.title === CORE.title && item.level === CORE.level) );

    if (coreParent && coreParent.id === this.item.parent_id && this.item.level === 2) { // Core category with level 2
      this.controlTitleIsNumber = true; // title input is number
    }
  }

  getSegments() {
    // NOT a category
    if (!this.item || !this.item.hasOwnProperty('parent_id') || !this.item.hasOwnProperty('level') || !this.item.hasOwnProperty('title')) {
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

      // Packed Goods
      let fourthLevelList = mergedThirdLevelList.map((parent) => this.multiSelectService.getDropdownById(this.categories, parent.id) );
      let mergedFourthLevelList: CategoryModel[] = [];
      fourthLevelList.map(arr => mergedFourthLevelList.push(...arr) );

      // Packed Good item
      let foundPackedGood: CategoryModel = mergedFourthLevelList.find(item => (item.id === this.item.id && item.level === this.item.level));
    
      if (foundPackedGood) {
        this.showMetadataFilmGrade = true;
        this.getMetadata.addControl('film_grade', new FormControl([], [Validators.required])); // new empty control

        // SET value
        if (foundPackedGood.hasOwnProperty('metadata') && foundPackedGood.metadata.hasOwnProperty('film_grade')) {
          let filmGradeItem: FilmGradeModel = this.filmGradeList.find(item => item.id === foundPackedGood.metadata.film_grade);
          this.getMetadata.get('film_grade').setValue((filmGradeItem) ? [filmGradeItem] : []);
        } else { // by default
          let foundParentThirdLevel: CategoryModel = mergedThirdLevelList.find(item => item.id === foundPackedGood.parent_id);
          let foundParentSecondLevel: CategoryModel = (foundParentThirdLevel)
            ? secondLevelList.find(item => item.id === foundParentThirdLevel.parent_id)
            : null;

          if (foundParentSecondLevel && foundParentThirdLevel) {
            let segmentFood: string = 'Food';
            let segmentTypeDryFood: string = 'Dry Food';
            let others: string = 'Non Food';

            if (foundParentSecondLevel.title.includes(segmentFood)) {
              if (foundParentThirdLevel.title.includes(segmentTypeDryFood)) {
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
  }

  getFoodContacts() {
    // NOT a category
    if (!this.item || !this.item.hasOwnProperty('parent_id') || !this.item.hasOwnProperty('level') || !this.item.hasOwnProperty('title')) {
      return false;
    }

    const FOOD_CONTACTS = AppConstants.MainCategoryNames.FOOD_CONTACTS;
    let foodContactsParent: CategoryModel = this.categories
      .find((item) => (item.title === FOOD_CONTACTS.title && item.level === FOOD_CONTACTS.level) );
    
    if (foodContactsParent) {
      // Second level - Certification types
      let secondLevel: number = 2;
      let foundItemSecondLevel: boolean = (this.item.parent_id === foodContactsParent.id && this.item.level === secondLevel);

      if (foundItemSecondLevel) {
        // certification_type field
        this.showMetadataCertificationType = true;
        this.certificationTypeList = this.certificationTypeList.filter(certItem => certItem.type === AppConstants.CertificationTypeNames.FOOD); // only FOOD item
        let selectedType: string = (this.item.metadata && this.item.metadata.certification_type)
          ? this.item.metadata.certification_type
          : '';
        let foundSelectedItemType = this.certificationTypeList.find(item => item.type === selectedType);
        this.getMetadata.addControl('certification_type', new FormControl((foundSelectedItemType) ? [foundSelectedItemType] : [], [Validators.required])); // new empty control
      }
    }
  }

  getProductFamily() {
    // NOT a category
    if (!this.item || !this.item.hasOwnProperty('parent_id') || !this.item.hasOwnProperty('level') || !this.item.hasOwnProperty('title')) {
      return false;
    }

    const PRODUCT_FAMILY = AppConstants.MainCategoryNames.PRODUCT_FAMILY;
    let productFamilyParent: CategoryModel = this.categories
      .find((item) => (item.title === PRODUCT_FAMILY.title && item.level === PRODUCT_FAMILY.level) );

    if (productFamilyParent) {
      // Second level
      let secondLevel: number = 2;
      let foundItemSecondLevel: boolean = (this.item.parent_id === productFamilyParent.id && this.item.level === secondLevel);

      if (foundItemSecondLevel) {
        // product_family_logo field
        this.showMetadataProductFamilyLogo = true;
        this.productFamilyLogoOld = (this.item.metadata && this.item.metadata.product_family_logo)
          ? [this.item.metadata.product_family_logo]
          : [];
        this.getMetadata.addControl('product_family_logo', new FormControl('')); // new empty control

        // product_family_display_priority field
        let preselectProductFamilyDisplayPriority: number[] = (this.item?.metadata?.product_family_display_priority)
          ? [this.item?.metadata?.product_family_display_priority]
          : [];
        this.getMetadata.addControl('product_family_display_priority', new FormControl(preselectProductFamilyDisplayPriority)); // new and preselect control
      }
    }
  }

  addProductFamilyLogoEvent(images: PhotosResponse) {
    this.productFamilyLogoNew = (images && images.newImages) ? images.newImages : [];
    this.productFamilyLogoOld = (images && images.oldImages) ? images.oldImages : [];
  }

  getApplicationType() {
    // NOT a category
    if (!this.item || !this.item.hasOwnProperty('parent_id') || !this.item.hasOwnProperty('level') || !this.item.hasOwnProperty('title')) {
      return false;
    }

    const APPLICATION_TYPE = AppConstants.MainCategoryNames.APPLICATION_TYPE;
    let applicationTypeParent: CategoryModel = this.categories
      .find((item) => (item.title === APPLICATION_TYPE.title && item.level === APPLICATION_TYPE.level) );
      
    if (applicationTypeParent) {
      // Second level
      let secondLevel: number = 2;
      let foundItemSecondLevel: boolean = (this.item.parent_id === applicationTypeParent.id && this.item.level === secondLevel);

      if (foundItemSecondLevel) {
        // application_type_logo field
        this.showMetadataApplicationTypeLogo = true;
        this.applicationTypeLogoOld = (this.item.metadata && this.item.metadata.application_type_logo)
          ? [this.item.metadata.application_type_logo]
          : [];
        this.getMetadata.addControl('application_type_logo', new FormControl('')); // new empty control

        // application_type_display_priority field
        let preselectApplicationTypeDisplayPriority: number[] = (this.item?.metadata?.application_type_display_priority)
          ? [this.item?.metadata?.application_type_display_priority]
          : [];
        this.getMetadata.addControl('application_type_display_priority', new FormControl(preselectApplicationTypeDisplayPriority)); // new and preselect control
      }
    }
  }

  addApplicationTypeLogoEvent(images: PhotosResponse) {
    this.applicationTypeLogoNew = (images && images.newImages) ? images.newImages : [];
    this.applicationTypeLogoOld = (images && images.oldImages) ? images.oldImages : [];
  }

  getCompostabilityLogos() {
    // NOT a category
    if (!this.item || !this.item.hasOwnProperty('parent_id') || !this.item.hasOwnProperty('level') || !this.item.hasOwnProperty('title')) {
      return false;
    }

    const COMPOSTABILITY_LOGOS = AppConstants.MainCategoryNames.COMPOSTABILITY_LOGOS;
    let compostabilityLogosParent: CategoryModel = this.categories
      .find((item) => (item.title === COMPOSTABILITY_LOGOS.title && item.level === COMPOSTABILITY_LOGOS.level) );
    
    if (compostabilityLogosParent) {
      // Second level - Certification types
      let secondLevelList: CategoryModel[] = this.multiSelectService.getDropdownById(this.categories, compostabilityLogosParent.id);
      let secondLevel: number = 2;
      let foundItemSecondLevel: boolean = (this.item.parent_id === compostabilityLogosParent.id && this.item.level === secondLevel);

      if (foundItemSecondLevel) {
        // certification_type field
        this.showMetadataCertificationType = true;
        this.certificationTypeList = this.certificationTypeList.filter(certItem => certItem.type !== AppConstants.CertificationTypeNames.FOOD); // without FOOD item
        let selectedType: string = (this.item.metadata && this.item.metadata.certification_type)
          ? this.item.metadata.certification_type
          : '';
        let foundSelectedItemType = this.certificationTypeList.find(item => item.type === selectedType);
        this.getMetadata.addControl('certification_type', new FormControl((foundSelectedItemType) ? [foundSelectedItemType] : [], [Validators.required])); // new empty control
        
        // certification_logo field
        this.showMetadataCertificationLogo = true;
        this.certificationLogosOld = (this.item.metadata && this.item.metadata.certification_logo)
          ? [this.item.metadata.certification_logo]
          : [];
        this.getMetadata.addControl('certification_logo', new FormControl('', [Validators.required])); // new empty control
        this.validCertificationLogo();
      }

      // Third level
      let thirdLevel: number = 3;
      let foundItemThirdLevel = secondLevelList.find(item => this.item.parent_id === item.id && this.item.level === thirdLevel);
      if (foundItemThirdLevel) {
        // certification_file field
        this.showMetadataCertificationFile = true;
        this.certificationFileOld = (this.item.metadata && this.item.metadata.certification_file)
          ? this.item.metadata.certification_file
          : null;
        this.getMetadata.addControl('certification_file', new FormControl('', [Validators.required])); // new empty control
        this.validCertificationFile();
      }
    }
  }

  validCertificationFile() {
    let control = this.getMetadata.get('certification_file');
    if (!control) { return false; }

    if (this.certificationFileNew || this.certificationFileOld) {
      control.clearValidators();
    } else {
      control.setValidators([Validators.required]);
    }
    control.updateValueAndValidity();
    control.markAllAsTouched();
  }

  addCertificationFile(files: FileList) {
    this.certificationFileNew = files[0];
    this.certificationFileOld = null;
    this.validCertificationFile();
  }

  deleteCertificationFile() {
    this.certificationFileNew = null;
    this.certificationFileOld = null;
    this.validCertificationFile();
  }

  validCertificationLogo() {
    let control = this.getMetadata.get('certification_logo');
    if (!control) { return false; }

    if ((this.certificationLogosNew && this.certificationLogosNew.length) || (this.certificationLogosOld && this.certificationLogosOld.length)) {
      control.clearValidators();
    } else {
      control.setValidators([Validators.required]);
    }
    control.updateValueAndValidity();
    control.markAllAsTouched();
  }

  addCompostabilityLogoEvent(images: PhotosResponse) {
    this.certificationLogosNew = (images && images.newImages) ? images.newImages : [];
    this.certificationLogosOld = (images && images.oldImages) ? images.oldImages : [];
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
      this.fileService.uploadAllNewImages(this.certificationLogosNew, certificatesImageQuery)
        .then((images: string[]) => {
          if (this.showMetadataCertificationLogo) { // when certification_logo is visible
            let imageIdList: string[] = this.fileService.filterImageArray(this.certificationLogosOld);
            imageIdList.push(...images);
            data.metadata.certification_logo = (imageIdList && imageIdList.length) ? imageIdList[0] : ''; // get first item, because it's single logo
          }

          // certification_file
          this.fileService.uploadAllNewImages(
              (this.certificationFileNew) ? [this.certificationFileNew] : [],
              certificatesFileQuery
            )
            .then((resCertFile: string[]) => {
              if (this.showMetadataCertificationFile) { // when certification_file is visible
                let certIdList: string[] = (this.certificationFileOld && this.certificationFileOld.id) ? [this.certificationFileOld.id] : [];
                certIdList.push(...resCertFile);
                data.metadata.certification_file = (certIdList && certIdList.length) ? certIdList[0] : ''; // get first item, because it's single file
              }

              // application_type_logo
              this.fileService.uploadAllNewImages(this.applicationTypeLogoNew, applicationTypeImageQuery)
                .then((resApplicationTypeLogos: string[]) => {
                  if (this.showMetadataApplicationTypeLogo) { // when application_type_logo is visible
                    let applicationTypeLogoIdList: string[] = this.fileService.filterImageArray(this.applicationTypeLogoOld);
                    applicationTypeLogoIdList.push(...resApplicationTypeLogos);
                    data.metadata.application_type_logo = (applicationTypeLogoIdList && applicationTypeLogoIdList.length) ? applicationTypeLogoIdList[0] : ''; // get first item, because it's single logo
                  }

                  // product_family_logo
                  this.fileService.uploadAllNewImages(this.productFamilyLogoNew, productFamilyImageQuery)
                    .then((resProductFamilyLogos: string[]) => {
                      if (this.showMetadataProductFamilyLogo) { // when product_family_logo is visible
                        let productFamilyLogoIdList: string[] = this.fileService.filterImageArray(this.productFamilyLogoOld);
                        productFamilyLogoIdList.push(...resProductFamilyLogos);
                        data.metadata.product_family_logo = (productFamilyLogoIdList && productFamilyLogoIdList.length) ? productFamilyLogoIdList[0] : ''; // get first item, because it's single logo
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

  edit() {
    switch(this.status.toLowerCase()) {
      case 'Category'.toLowerCase():
        this.editCategory();
        break;
      case 'Thickness'.toLowerCase():
        this.editThickness();
        break;
      default:
        console.error('Status (Category | Thickness) is not a match !!!');
        break;
    }
  }

  editCategory() {
    let data = _.cloneDeep(this.editCategoryForm.value);
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
        // EDIT category
        this.categoryService
          .editCategory(this.itemId, resData)
          .subscribe(
            (category: CategoryModel) => {
              this.alertService.showSuccess('Successfully edited!');
              this.store.dispatch(
                new CategoryActions.UpdateCategory({
                  categoryId: this.itemId,
                  newCategory: category,
                })
              );
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

  editThickness() {
    let body = {
      value: parseInt(this.editCategoryForm.value.title)
    };

    this.thicknessService.editThickness(this.itemId, body).subscribe(
      (thickness: ThicknessModel) => {
        this.alertService.showSuccess('Successfully edited!');
        this.store.dispatch(new ThicknessActions.UpdateThickness({...thickness}));
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
    return this.editCategoryForm.get('metadata') as FormGroup;
  }

  get getMetadataHints(): FormArray {
    if (!this.getMetadata.contains('hints')) { return null; }

    return this.getMetadata.get('hints') as FormArray;
  }

  closeModal() {
    this.bsModalRef.hide();
  }
}
