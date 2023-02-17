import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

// Modules
import { SharedModule } from '../shared/shared.module';
import { QuoteRequestRoutingModule } from './quote-request-routing.module';
import { TooltipModule } from 'ngx-bootstrap/tooltip';

// Components
import { QuoteRequestComponent } from './quote-request.component';
import { FastTrackComponent } from './components/fast-track/fast-track.component';

@NgModule({
  declarations: [
    QuoteRequestComponent,
    FastTrackComponent
  ],
  imports: [
    CommonModule,
    QuoteRequestRoutingModule,
    SharedModule,
    TooltipModule.forRoot()
  ],
})
export class QuoteRequestModule {}
