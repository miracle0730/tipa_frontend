import { NgModule } from '@angular/core';
import { HttpClientModule } from '@angular/common/http';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { RouterModule } from '@angular/router';
import { LoaderComponent } from './components/loader/loader.component';
import { ToastrModule } from 'ngx-toastr';
/**
 *
 * [CoreModule]:
 * - global/HTTP services (only one instance of those services will be created across the entire app)
 * - important single use components/classes
 * - export any third party module that is required in the AppModule
 *
 * Important note:
 * Import CoreModule ONLY in the main AppModule, not in the Feature Modules.
 */

@NgModule({
  imports: [
    HttpClientModule,
    BrowserAnimationsModule,
    RouterModule,
    ToastrModule.forRoot()
  ],
  declarations: [LoaderComponent],
  providers: [],
  exports: [
    HttpClientModule,
    BrowserAnimationsModule,
    RouterModule,
    LoaderComponent
  ],
})
export class CoreModule {}
