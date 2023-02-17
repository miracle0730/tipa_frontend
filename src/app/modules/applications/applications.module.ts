import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SharedModule } from '../shared/shared.module';
import { ApplicationsComponent } from './applications.component';
import { ApplicationsRoutingModule } from './applications-routing.module';
@NgModule({
  declarations: [ApplicationsComponent],
  imports: [CommonModule, ApplicationsRoutingModule, SharedModule],
})
export class ApplicationsModule {}
