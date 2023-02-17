import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { CommonModule } from '@angular/common';
import { ComparisonComponent } from './comparison.component';

const routes: Routes = [{ path: '', component: ComparisonComponent }];

@NgModule({
  imports: [CommonModule, RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class ComparisonRoutingModule {}
