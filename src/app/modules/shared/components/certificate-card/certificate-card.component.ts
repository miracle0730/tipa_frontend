import { Component, OnInit, OnDestroy, Input, } from '@angular/core';

// Models
import { CategoryModel, CertificatesModel, CertificateTypeModel, ImageModel, MetadataCertificateGraphicsModel } from '@models';

// Modals
import { BsModalService } from 'ngx-bootstrap/modal';
import { ModalCertificateGraphicsComponent } from '../../modals/modal-certificate-graphics/modal-certificate-graphics.component';

// Redux
import { Store } from '@ngrx/store';
import * as fromApp from '@store/app.reducer';

// Constants
import { AppConstants } from '@core/app.constants';

// Libs
import { forkJoin, Observable, Subscription } from 'rxjs';
import { map } from 'rxjs/operators';
import * as _ from 'lodash';

@Component({
  selector: 'app-certificate-card',
  templateUrl: './certificate-card.component.html',
  styleUrls: ['./certificate-card.component.scss']
})
export class CertificateCardComponent implements OnInit, OnDestroy {
  @Input() certificate: CertificatesModel;

  public categoriesSubscription: Subscription;
  public multiSubscription: Subscription;

  public categories: CategoryModel[] = [];
  public certificateCategory: CategoryModel;
  public certifiedByCategory: CategoryModel;
  public thicknessValue: string;
  public certificateLogo: ImageModel;
  public certificateFile: ImageModel;
  public certificateGraphics: MetadataCertificateGraphicsModel[] = [];
  public certificateType: CertificateTypeModel;

  constructor(
    private store: Store<fromApp.AppState>,
    private modalService: BsModalService,
  ) { }

  ngOnInit(): void {
    this.multiSubscription = forkJoin([this.getCategories()]).subscribe((allResponses) => {
      // Initial data
      this.getInitialData();
    }, (err) => {});
  }

  ngOnDestroy() {
    if (this.categoriesSubscription) {
      this.categoriesSubscription.unsubscribe();
    }
    if (this.multiSubscription) {
      this.multiSubscription.unsubscribe();
    }
  }

  getCategories() {
    return new Observable((observer) => {
      this.categoriesSubscription = this.store
        .select('categories')
        .pipe(map((categoryState) => categoryState.categories))
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

  getInitialData() {
    this.certificateCategory = (this.certificate) ? this.categories.find(item => item?.id === this.certificate?.certificate_id) : null;
    this.certifiedByCategory = (this.certificateCategory) ? this.categories.find(item => item?.id === this.certificateCategory?.metadata?.certificate_certified_by) : null;

    if (!this.certificate || !this.certificateCategory) { return false; }

    this.certificateLogo = this.certificateCategory?.metadata?.certificate_logo as ImageModel;
    this.certificateFile = this.certificateCategory?.metadata?.certificate_file as ImageModel;
    this.certificateGraphics = (Array.isArray(this.certificateCategory?.metadata?.certificate_graphics)) ? this.certificateCategory?.metadata?.certificate_graphics : [];
    this.certificateType = AppConstants.CertificateTypeList.find(item => item?.id === this.certificateCategory?.metadata?.certificate_type);

    if (Array.isArray(this.certificate?.thickness)) {
      let nameAllThickness = this.certificate?.thickness.find(item => item === AppConstants.CertificateThicknessNames.ALL_THICKNESS);
      this.thicknessValue = (nameAllThickness) ? String(nameAllThickness) : this.certificate?.thickness.join(', ');
    }
  }

  modalCertificateGraphics() {
    const config = {
      class: 'modal-lg modal-dialog-centered',
      initialState: {
        certificateGraphics: this.certificateGraphics
      },
    };
    this.modalService.show(ModalCertificateGraphicsComponent, config);
  }
}
