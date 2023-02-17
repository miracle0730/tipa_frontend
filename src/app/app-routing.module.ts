import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { AuthGuard } from './core/guards/auth.guard';
import { CategoryResolverService } from './core/services/category/category-resolver.service';
import { ProfileResolverService } from './core/services/profile/profile-resolver.service';
import { IsAdminGuard } from './core/guards/is-admin.guard';

const routes: Routes = [
  {
    path: '',
    redirectTo: '/login',
    pathMatch: 'full',
  },
  {
    path: '',
    loadChildren: () =>
      import('./modules/auth/auth.module').then(
        (m) => m.AuthModule
      )
  },
  {
    path: 'products',
    loadChildren: () =>
      import('./modules/products/products.module').then(
        (m) => m.ProductsModule
      ),
    canActivate: [AuthGuard],
    resolve: [ProfileResolverService, CategoryResolverService],
  },
  {
    path: 'applications',
    loadChildren: () =>
      import('./modules/applications/applications.module').then(
        (m) => m.ApplicationsModule
      ),
    canActivate: [AuthGuard],
    resolve: [ProfileResolverService, CategoryResolverService],
  },
  {
    path: 'users',
    loadChildren: () =>
      import('./modules/users/users.module').then(
        (m) => m.UsersModule
      ),
    canActivate: [AuthGuard],
    resolve: [ProfileResolverService, CategoryResolverService],
  },
  {
    path: 'product-info/:id',
    loadChildren: () =>
      import('./modules/product-info/product-info.module').then(
        (m) => m.ProductInfoModule
      ),
    canActivate: [AuthGuard],
    resolve: [ProfileResolverService, CategoryResolverService],
  },
  {
    path: 'application-info/:id',
    loadChildren: () =>
      import('./modules/application-info/application-info.module').then(
        (m) => m.ApplicationInfoModule
      ),
    canActivate: [AuthGuard],
    resolve: [ProfileResolverService, CategoryResolverService],
  },
  {
    path: 'categories',
    loadChildren: () =>
      import('./modules/categories/categories.module').then(
        (m) => m.CategoriesModule
      ),
    canActivate: [AuthGuard, IsAdminGuard],
    resolve: [ProfileResolverService, CategoryResolverService],
  },
  {
    path: 'comparison',
    loadChildren: () =>
      import('./modules/comparison/comparison.module').then(
        (m) => m.ComparisonModule
      ),
    canActivate: [AuthGuard],
    resolve: [ProfileResolverService, CategoryResolverService],
  },
  {
    path: 'rfq',
    loadChildren: () =>
      import('./modules/quote-request/quote-request.module').then(
        (m) => m.QuoteRequestModule
      ),
    canActivate: [AuthGuard],
    resolve: [ProfileResolverService, CategoryResolverService],
  },
  {
    path: '**',
    redirectTo: 'login',
  },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule],
})
export class AppRoutingModule {}
