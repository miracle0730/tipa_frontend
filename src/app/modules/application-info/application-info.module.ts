import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

// Modules
import { SharedModule } from '../shared/shared.module';
import { ApplicationInfoRoutingModule } from './application-info-routing.module';
import { TooltipModule } from 'ngx-bootstrap/tooltip';

// Components
import { ApplicationInfoComponent } from './application-info.component';
import { ApplicationFastTrackComponent } from './components';

// Pipes
import { DisplayReelPipe } from './pipes';

@NgModule({
  declarations: [
    ApplicationInfoComponent,
    ApplicationFastTrackComponent,
    DisplayReelPipe
  ],
  imports: [
    CommonModule,
    ApplicationInfoRoutingModule,
    SharedModule,
    TooltipModule.forRoot(),
  ],
})
export class ApplicationInfoModule {}
