import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ComparisonRoutingModule } from './comparison-routing.module';
import { ComparisonComponent } from './comparison.component';
import { SharedModule } from '../shared/shared.module';

@NgModule({
  declarations: [ComparisonComponent],
  imports: [CommonModule, ComparisonRoutingModule, SharedModule],
})
export class ComparisonModule {}
