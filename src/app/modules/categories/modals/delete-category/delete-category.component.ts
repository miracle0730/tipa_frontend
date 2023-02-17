import { Component, OnInit } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { BsModalRef } from 'ngx-bootstrap/modal';
import { AlertService, CategoryService, ThicknessService } from '@services';

import { Store } from '@ngrx/store';
import * as fromApp from '@store/app.reducer';
import * as CategoryActions from '@store/category/category.actions';
import * as ThicknessActions from '@store/thickness/thickness.actions';

@Component({
  selector: 'app-delete-category',
  templateUrl: './delete-category.component.html',
  styleUrls: ['./delete-category.component.scss'],
})
export class DeleteCategoryComponent implements OnInit {
  public status: string; // Category | Thickness
  public itemInfo: { id: number; title: number | string };

  constructor(
    private store: Store<fromApp.AppState>,
    private bsModalRef: BsModalRef,
    private categoryService: CategoryService,
    private alertService: AlertService,
    private thicknessService: ThicknessService
  ) {}

  ngOnInit() {}

  delete() {
    switch(this.status.toLowerCase()) {
      case 'Category'.toLowerCase():
        this.deleteCategory();
        break;
      case 'Thickness'.toLowerCase():
        this.deleteThickness();
        break;
      default:
        console.error('Status (Category | Thickness) is not a match !!!');
        break;
    }
  }

  deleteCategory() {
    this.categoryService.deleteCategory(this.itemInfo.id).subscribe(
      (res) => {
        this.alertService.showSuccess('Successfully deleted!');
        this.store.dispatch(new CategoryActions.DeleteCategory(this.itemInfo.id));
        this.closeModal();
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

  deleteThickness() {
    this.thicknessService.deleteThickness(this.itemInfo.id).subscribe(
      (res) => {
        this.alertService.showSuccess('Successfully deleted!');
        this.store.dispatch(new ThicknessActions.DeleteThickness(this.itemInfo.id));
        this.closeModal();
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
