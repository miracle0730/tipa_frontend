import { Component, OnInit, OnDestroy } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { FormGroup, FormBuilder, FormControl, Validators, FormArray, ValidatorFn, ValidationErrors, } from '@angular/forms';

// Services
import { AlertService, MultiSelectService, FileService, CategoryService, } from '@services';

// Models
import { CategoryModel, CertificateAvailableForModel, CertificateTypeModel, ImageModel, MetadataCertificateGraphicsModel, PhotosResponse, } from '@models';

// Constants
import { AppConstants } from '@core/app.constants';

// Redux
import { Store } from '@ngrx/store';
import * as fromApp from '@store/app.reducer';
import * as CategoryActions from '@store/category/category.actions';

// Libraries
import { BsModalRef } from 'ngx-bootstrap/modal';
import { IDropdownSettings } from 'ng-multiselect-dropdown';
import { Subscription } from 'rxjs';
import { map } from 'rxjs/operators';
import * as _ from 'lodash';

@Component({
  selector: 'app-modal-category-certificates',
  templateUrl: './modal-category-certificates.component.html',
  styleUrls: ['./modal-category-certificates.component.scss']
})
export class ModalCategoryCertificatesComponent implements OnInit, OnDestroy {
  public categoryData: CategoryModel; // Input variable

  public categoriesSubscription: Subscription;

  public categoryForm: FormGroup;
  public editCategory: boolean;
  public categories: CategoryModel[] = [];
  public certificateTypeList: CertificateTypeModel[] = _.cloneDeep(AppConstants.CertificateTypeList);
  public certificateAvailableForList: CertificateAvailableForModel[] = _.cloneDeep(AppConstants.CertificateAvailableForList);
  public certificateCertifiedByList: CategoryModel[] = [];

  public singleDropdownSettings: IDropdownSettings = {
    singleSelection: true,
    idField: 'id',
    textField: 'title',
    itemsShowLimit: 1,
    allowSearchFilter: false,
    enableCheckAll: false,
    closeDropDownOnSelection: true,
  };
  public multiDropdownSettings: IDropdownSettings = {
    singleSelection: false,
    idField: 'id',
    textField: 'title',
    itemsShowLimit: 1,
    allowSearchFilter: false,
    enableCheckAll: false,
  };

  constructor(
    private store: Store<fromApp.AppState>,
    private bsModalRef: BsModalRef,
    private formBuilder: FormBuilder,
    private alertService: AlertService,
    private multiSelectService: MultiSelectService,
    private fileService: FileService,
    private categoryService: CategoryService,
  ) {
    this.categoryForm = this.formBuilder.group({
      title: new FormControl('', Validators.required),
      metadata: new FormGroup({}), // metadata is dynamic
    });
  }

  ngOnInit(): void {
    this.getCategories();
  }

  ngOnDestroy() {
    if (this.categoriesSubscription) {
      this.categoriesSubscription.unsubscribe();
    }
  }

  get getMetadata() {
    return this.categoryForm.get('metadata') as FormGroup;
  }

  get getCertificateGraphicsArray(): FormArray {
    return (this.getMetadata) ? this.getMetadata?.get('certificate_graphics') as FormArray : null;
  }

  buildAndPreselectCategoryForm() {
    let mainCategory: CategoryModel = this.categoryService.getMainCategoryBySubCategory(this.categories, this.categoryData);
    let isMainCategoryCertificates: boolean = this.categoryService.getEqualityMainCategory(mainCategory, AppConstants.MainCategoryNames.CERTIFICATES);

    // This modal only for all categories of certificates
    if (!this.categoryData || !isMainCategoryCertificates) {
      setTimeout(() => { this.closeModal(); }, 0); // IMPORTANT setTimeout, because without setTimeout it doesn't work
      return false;
    }

    // Edit or New category
    if (this.categoryData?.id) { // Edit
      this.editCategory = true;
      this.categoryForm.get('title').setValue(this.categoryData?.title || '');
    } else { // New
      this.editCategory = false;
      this.categoryForm.addControl('parent_id', new FormControl(this.categoryData?.parent_id || null));
      this.categoryForm.addControl('level', new FormControl(this.categoryData?.level || null));
    }

    // Build and Preselect form by level
    let categoryLevel: number = this.categoryData?.level;
    if (categoryLevel === 2) {
      // certificate_type
      let foundCertificateType: CertificateTypeModel = (this.categoryData?.metadata?.hasOwnProperty('certificate_type'))
        ? this.certificateTypeList.find(item => item?.id === this.categoryData?.metadata?.certificate_type)
        : null;
      let preselectCertificateType: CertificateTypeModel[] = (foundCertificateType)
        ? [foundCertificateType]
        : [];
      this.getMetadata.addControl('certificate_type', new FormControl(preselectCertificateType, [Validators.required]));

      // certificate_logo
      let certificateLogoValue: ImageModel | any = this.categoryData?.metadata?.certificate_logo || '';
      let preselectCertificateLogoOldImages: ImageModel[] = (certificateLogoValue) ? [certificateLogoValue] : [];
      this.getMetadata.addControl('certificate_logo', new FormGroup({
        oldImages: new FormControl(preselectCertificateLogoOldImages),
        newImages: new FormControl([]),
      }, {validators: this.certificateLogoValidators()}));

      // certificate_available_for
      let preselectCertificateAvailableFor: CertificateAvailableForModel[] = (Array.isArray(this.categoryData?.metadata?.certificate_available_for))
        ? this.categoryData?.metadata?.certificate_available_for
            .map(id => this.certificateAvailableForList.find(item => item?.id === id))
            .filter(item => item)
        : [];
      this.getMetadata.addControl('certificate_available_for', new FormControl(preselectCertificateAvailableFor));

      // certificate_certified_by
      let foundCertificateCertifiedBy: CategoryModel = (this.categoryData?.metadata?.hasOwnProperty('certificate_certified_by'))
        ? this.certificateCertifiedByList.find(item => item?.id === this.categoryData?.metadata?.certificate_certified_by)
        : null;
      let preselectCertificateCertifiedBy: CategoryModel[] = (foundCertificateCertifiedBy)
        ? [foundCertificateCertifiedBy]
        : [];
      this.getMetadata.addControl('certificate_certified_by', new FormControl(preselectCertificateCertifiedBy, [Validators.required]));

      // certificate_file
      let preselectCertificateFile: ImageModel | File | string = this.categoryData?.metadata?.certificate_file || '';
      this.getMetadata.addControl('certificate_file', new FormControl(preselectCertificateFile));

      // certificate_graphics
      let certificateGraphicsValue: MetadataCertificateGraphicsModel[] = (Array.isArray(this.categoryData?.metadata?.certificate_graphics) && this.categoryData?.metadata?.certificate_graphics?.length)
        ? this.categoryData?.metadata?.certificate_graphics
        : [{ file: '', preview_image: '', }];
      let preselectCertificateGraphics = certificateGraphicsValue.map(item => {
        let initialControl: FormGroup = this.getInitialCertificateGraphicsItem();
        initialControl.patchValue(item);
        return initialControl;
      });
      this.getMetadata.addControl('certificate_graphics', new FormArray(preselectCertificateGraphics));
    }
  }

  save() {
    let data = this.transformData();
    if (!data) { return false; }

    this.uploadAllFiles(data)
      .then((resData) => {
        if (this.editCategory) {
          // Edit a category
          this.categoryService.editCategory(this.categoryData?.id, resData).subscribe(
            (category: CategoryModel) => {
              this.alertService.showSuccess('Successfully edited!');
              this.store.dispatch(
                new CategoryActions.UpdateCategory({
                  categoryId: this.categoryData?.id,
                  newCategory: category,
                })
              );
              this.closeModal();
            },
            (err: HttpErrorResponse) => {
              this.alertService.showError(err.error.message);
            }
          );
        } else {
          // Add new category
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
        }
      })
      .catch((err) => {
        this.alertService.showError('');
      });
  }

  transformData(): any {
    let formData = _.cloneDeep(this.categoryForm.value);
    if (!formData) { return null; }

    let data = {
      title: (formData?.title) ? String(formData?.title) : '',
      metadata: {},
    };

    // When Add a new category, need the parent_id field
    if (formData?.hasOwnProperty('parent_id')) {
      data['parent_id'] = Number(formData?.parent_id);
    }

    // When Add a new category, need the level field
    if (formData?.hasOwnProperty('level')) {
      data['level'] = Number(formData?.level);
    }

    // Metadata
    if (formData?.metadata) {
      let metadata = formData?.metadata;

      if (metadata?.hasOwnProperty('certificate_type')) {
        let certificateTypeValue: CertificateTypeModel[] = metadata?.certificate_type;
        let value: number = (Array.isArray(certificateTypeValue) && certificateTypeValue?.length)
          ? certificateTypeValue[0]?.id
          : null;
        data.metadata['certificate_type'] = value; // Single select
      }

      if (metadata?.hasOwnProperty('certificate_available_for')) {
        let certificateAvailableForValue: CertificateAvailableForModel[] = metadata?.certificate_available_for;
        let value: number[] = (Array.isArray(certificateAvailableForValue) && certificateAvailableForValue?.length)
          ? certificateAvailableForValue.map(item => item?.id)
          : [];
        data.metadata['certificate_available_for'] = value; // Multi select
      }

      if (metadata?.hasOwnProperty('certificate_certified_by')) {
        let certificateCertifiedByValue: CategoryModel[] = metadata?.certificate_certified_by;
        let value: number = (Array.isArray(certificateCertifiedByValue) && certificateCertifiedByValue?.length)
          ? certificateCertifiedByValue[0]?.id
          : null;
        data.metadata['certificate_certified_by'] = value; // Single select
      }
    }

    return data;
  }

  uploadAllFiles(data) {
    return new Promise((resolve, reject) => {
      const certificatesImageQuery = [
        { key: 'itemType', value: 'certificates' },
        { key: 'fileType', value: 'image' },
      ];
      const certificatesFileQuery = [
        { key: 'itemType', value: 'certificates' },
        { key: 'fileType', value: 'document' },
      ];

      // Promise certificate_logo
      let certificateLogoControl = this.getMetadata.get('certificate_logo');
      let certificateLogoOldImagesValue: ImageModel[] = (certificateLogoControl) ? certificateLogoControl.get('oldImages')?.value || [] : [];
      let certificateLogoNewImagesValue: File[] = (certificateLogoControl) ? certificateLogoControl.get('newImages')?.value || [] : [];
      let certificateLogoPromise = this.fileService.uploadAllNewImages(certificateLogoNewImagesValue, certificatesImageQuery);

      // Promise certificate_file
      let certificateFileControl = this.getMetadata.get('certificate_file');
      let certificateFileValue = (certificateFileControl) ? certificateFileControl?.value : null; // Type can be: File || ImageModel
      let certificateFileUpload: File[] = (certificateFileValue && certificateFileValue?.name) ? [certificateFileValue] : [];
      let certificateFilePromise = this.fileService.uploadAllNewImages(certificateFileUpload, certificatesFileQuery);

      // Promise certificate_graphics
      let certificateGraphicsControl = this.getMetadata.get('certificate_graphics');
      let certificateGraphicsValue: any[] = (certificateGraphicsControl) ? certificateGraphicsControl?.value || [] : [];
      let certificateGraphicsPromise = Promise.all(
        certificateGraphicsValue.map(item => {
          let fileUpload: File[] = (item?.file && item?.file?.name) ? [item?.file] : [];
          let previewImageUpload: File[] = (item?.preview_image && item?.preview_image?.name) ? [item?.preview_image] : [];

          return Promise.all([
            this.fileService.uploadAllNewImages(fileUpload, certificatesFileQuery),
            this.fileService.uploadAllNewImages(previewImageUpload, certificatesImageQuery),
          ]);
        })
      );

      // Continue transforming data, after the uploaded files
      Promise.all([certificateLogoPromise, certificateFilePromise, certificateGraphicsPromise])
        .then((allResponses) => {
          // Input promise and Output response of the promise, must be in the same index in the array
          let [certificateLogoRes, certificateFileRes, certificateGraphicsRes] = allResponses;

          // When certificate_logo is present in the form
          if (certificateLogoControl) {
            let value: string = (certificateLogoRes && certificateLogoRes?.length)
              ? String(certificateLogoRes[0])
              : (certificateLogoOldImagesValue && certificateLogoOldImagesValue.length) ? certificateLogoOldImagesValue[0]?.id || '' : '';
            data.metadata['certificate_logo'] = value;
          }

          // When certificate_file is present in the form
          if (certificateFileControl) {
            let value: string = (certificateFileRes && certificateFileRes?.length) ? String(certificateFileRes[0]) : certificateFileValue?.id || '';
            data.metadata['certificate_file'] = value;
          }

          // When certificate_graphics is present in the form
          if (certificateGraphicsControl) {
            let value: MetadataCertificateGraphicsModel[] = certificateGraphicsValue.map((item, index) => {
              let fileValue: string = '';
              let previewImageValue: string = '';

              if (certificateGraphicsRes && certificateGraphicsRes?.length && certificateGraphicsRes[index]) {
                let [fileUploaded, previewImageUploaded] = (certificateGraphicsRes[index] as any[]);
                fileValue = (fileUploaded && fileUploaded?.length && fileUploaded[0])
                  ? String(fileUploaded[0])
                  : item?.file?.id || '';
                previewImageValue = (previewImageUploaded && previewImageUploaded?.length && previewImageUploaded[0])
                  ? String(previewImageUploaded[0])
                  : item?.preview_image?.id || '';
              }

              item.file = fileValue;
              item.preview_image = previewImageValue;
              return item;
            });
            data.metadata['certificate_graphics'] = value;
          }

          resolve(data);
        })
        .catch((err) => {
          reject(err);
        });
    });
  }

  getCategories() {
    this.categoriesSubscription = this.store
      .select('categories')
      .pipe(map((categoryState) => categoryState.categories))
      .subscribe((categories: CategoryModel[]) => {
        this.categories = categories;

        // GET data list
        this.getCertificateCertifiedByList();

        // Build and Preselect form
        this.buildAndPreselectCategoryForm();
      });
  }

  getCertificateCertifiedByList() {
    const CERTIFIED_BY = AppConstants.MainCategoryNames.CERTIFIED_BY;
    let certifiedByListParent: CategoryModel = (this.categories)
      ? this.categories.find((category) => (category.title === CERTIFIED_BY.title && category.level === CERTIFIED_BY.level) )
      : null;

    // GET certificateCertifiedByList
    this.certificateCertifiedByList = (certifiedByListParent)
      ? this.multiSelectService.getDropdownById(this.categories, certifiedByListParent.id)
      : [];
  }

  certificateLogoValidators(): ValidatorFn {
    return (group: FormGroup): ValidationErrors => {
      const oldImagesControl = group.get('oldImages');
      const newImagesControl = group.get('newImages');

      if (!oldImagesControl || !newImagesControl) { return; }

      let oldImagesIsValid: boolean = Boolean(Array.isArray(oldImagesControl.value) && oldImagesControl.value?.length);
      let newImagesIsValid: boolean = Boolean(Array.isArray(newImagesControl.value) && newImagesControl.value?.length);

      if (!oldImagesIsValid && !newImagesIsValid) { // Error, when old and new images are empty
        return {required: true};
      } else {
        return;
      }
    }
  }

  certificateLogoEvent(images: PhotosResponse) {
    let certificateLogoControl = (this.getMetadata) ? this.getMetadata?.get('certificate_logo') : null;
    if (!images || !certificateLogoControl) { return false; }

    certificateLogoControl.patchValue({
      oldImages: (Array.isArray(images?.oldImages)) ? images.oldImages : [],
      newImages: (Array.isArray(images?.newImages)) ? images.newImages : [],
    });
    certificateLogoControl.markAllAsTouched(); // IMPORTANT, to show an error on the page
  }

  getInitialCertificateGraphicsItem(): FormGroup {
    return _.cloneDeep(
      new FormGroup({
        file: new FormControl(''),
        preview_image: new FormControl(''),
      })
    );
  }

  addCertificateGraphicsItem() {
    this.getCertificateGraphicsArray.push(this.getInitialCertificateGraphicsItem());
  }

  removeCertificateGraphicsItem(index: number) {
    this.getCertificateGraphicsArray.removeAt(index);
  }

  closeModal() {
    this.bsModalRef.hide();
  }
}
