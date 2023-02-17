import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { CommonModule } from '@angular/common';
import { ProductInfoComponent } from './product-info.component';

const routes: Routes = [{ path: '', component: ProductInfoComponent }];

@NgModule({
  imports: [CommonModule, RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class ProductInfoRoutingModule {}
