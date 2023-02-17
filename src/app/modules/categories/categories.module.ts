import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SharedModule } from '../shared/shared.module';
import { CategoriesRoutingModule } from './categories-routing.module';
import { CategoriesComponent } from './categories.component';
import { CollapseModule } from 'ngx-bootstrap/collapse';
import { ReactiveFormsModule } from '@angular/forms';

// Modals
import {
  AddCategoryComponent,
  EditCategoryComponent,
  DeleteCategoryComponent,
  ModalCategoryCertificatesComponent,
  ModalCategoryCertifiedByComponent,
  ModalPartnersComponent
} from './modals';

const modals: any[] = [
  AddCategoryComponent,
  EditCategoryComponent,
  DeleteCategoryComponent,
  ModalCategoryCertificatesComponent,
  ModalCategoryCertifiedByComponent,
  ModalPartnersComponent
];

@NgModule({
  imports: [
    CommonModule,
    SharedModule,
    ReactiveFormsModule,
    CategoriesRoutingModule,
    CollapseModule.forRoot(),
  ],
  declarations: [
    CategoriesComponent,
    ...modals,
  ],
  entryComponents: [
    ...modals,
  ],
})
export class CategoriesModule {}
