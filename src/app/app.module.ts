import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { LayoutModule } from '@angular/cdk/layout';
import { HTTP_INTERCEPTORS } from '@angular/common/http';
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { AuthModule } from './modules/auth/auth.module';

import { CoreModule } from './core/core.module';
import { LoaderInterceptorService } from './core/interceptors/loader.interceptor';
import { TokenInterceptor } from './core/interceptors/token.interceptor';
import { LoginInterceptor } from './core/interceptors/login.interceptor';

import { StoreModule } from '@ngrx/store';
import { EffectsModule } from '@ngrx/effects';
import { StoreDevtoolsModule } from '@ngrx/store-devtools';
import { CategoryEffects } from '@store/category/category.effects';
import { ThicknessEffects } from '@store/thickness/thickness.effects';
import { ProductEffects } from '@store/product/product.effects';
import { ApplicationEffects } from '@store/application/application.effects';
import { ProfileEffects } from '@store/profile/profile.effects';
import { ComparisonEffects } from '@store/comparison/comparison.effects';

import { clearState } from '@store/auth/auth.reducer';
import * as fromApp from '@store/app.reducer';
import { environment } from '../environments/environment';

@NgModule({
  declarations: [AppComponent],
  imports: [
    BrowserModule,
    AppRoutingModule,
    AuthModule,
    CoreModule,
    LayoutModule,
    StoreModule.forRoot(fromApp.appReducer, { metaReducers: [clearState] }),
    EffectsModule.forRoot([
      CategoryEffects,
      ThicknessEffects,
      ProductEffects,
      ApplicationEffects,
      ProfileEffects,
      ComparisonEffects,
    ]),
    StoreDevtoolsModule.instrument({
      logOnly: environment.production,
    }),
  ],
  providers: [
    { provide: HTTP_INTERCEPTORS, useClass: TokenInterceptor, multi: true },
    {
      provide: HTTP_INTERCEPTORS,
      useClass: LoaderInterceptorService,
      multi: true,
    },
    {
      provide: HTTP_INTERCEPTORS,
      useClass: LoginInterceptor,
      multi: true,
    },
  ],
  bootstrap: [AppComponent],
})
export class AppModule {}
