import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { CommonModule } from '@angular/common';
import { QuoteRequestComponent } from './quote-request.component';

const routes: Routes = [
  { path: '', component: QuoteRequestComponent }
];

@NgModule({
  imports: [CommonModule, RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class QuoteRequestRoutingModule {}
