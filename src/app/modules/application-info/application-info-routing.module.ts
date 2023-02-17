import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { CommonModule } from '@angular/common';
import { ApplicationInfoComponent } from './application-info.component';

const routes: Routes = [
  { path: '', component: ApplicationInfoComponent }
];

@NgModule({
  imports: [CommonModule, RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class ApplicationInfoRoutingModule {}
