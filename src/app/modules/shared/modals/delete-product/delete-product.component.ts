import { Component, OnInit } from '@angular/core';
import { BsModalRef } from 'ngx-bootstrap/modal';
import {
  ProductService,
  AlertService,
  ApplicationService,
  AmplitudeService,
} from '@services';
import { Router } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';

import { Store } from '@ngrx/store';
import * as fromApp from '@store/app.reducer';
import * as ApplicationActions from '@store/application/application.actions';
import * as ProductActions from '@store/product/product.actions';
import * as CompareActions from '@store/comparison/comparison.actions';
@Component({
  selector: 'app-delete-product',
  templateUrl: './delete-product.component.html',
  styleUrls: ['./delete-product.component.scss'],
})
export class DeleteProductComponent implements OnInit {
  public deleteMessage: string;
  public product: { id: number; title: string };
  public isProduct: boolean;
  constructor(
    private store: Store<fromApp.AppState>,
    private router: Router,
    private bsModalRef: BsModalRef,
    private productService: ProductService,
    private applicationService: ApplicationService,
    private alertService: AlertService,
    private amplitudeService: AmplitudeService
  ) {}

  ngOnInit() {}

  deleteProduct() {
    const activeCategory = localStorage.getItem('activeCategory');
    if (this.isProduct) {
      this.applicationService.deleteApplication(this.product.id).subscribe(
        (res) => {
          this.closeModal();
          this.router.navigate(['applications'], {
            queryParams: { category: activeCategory },
          });
          this.alertService.showSuccess('Successfully deleted!');
          this.amplitudeService.addNewEvent('Delete product', {
            productId: this.product.id,
            productTitle: this.product.title,
          });
          this.store.dispatch(new ApplicationActions.DeleteApplication(this.product.id));
          this.store.dispatch(new CompareActions.DeleteCompareApplication(this.product.id));
        },
        (err: HttpErrorResponse) => {
          const parsedError = this.isJSON(err.error)
            ? JSON.parse(err.error)
            : null;
          if (parsedError) {
            this.alertService.showError(parsedError.message);
          }
        }
      );
    } else {
      this.productService.deleteProduct(this.product.id).subscribe(
        (res) => {
          this.closeModal();
          this.router.navigate(['products'], {
            queryParams: { category: activeCategory },
          });
          this.alertService.showSuccess('Successfully deleted!');
          this.amplitudeService.addNewEvent('Delete material', {
            productId: this.product.id,
            productTitle: this.product.title,
          });
          this.store.dispatch(new ProductActions.DeleteProduct(this.product.id));
        },
        (err: HttpErrorResponse) => {
          const parsedError = this.isJSON(err.error)
            ? JSON.parse(err.error)
            : null;
          if (parsedError) {
            this.alertService.showError(parsedError.message);
          }
        }
      );
    }
  }

  private isJSON(str) {
    try {
      return JSON.parse(str) && !!str;
    } catch (e) {
      return false;
    }
  }

  closeModal() {
    this.bsModalRef.hide();
  }
}
