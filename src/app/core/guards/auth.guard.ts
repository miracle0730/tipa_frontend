import { Injectable } from '@angular/core';
import {
  CanActivate,
  ActivatedRouteSnapshot,
  RouterStateSnapshot,
  Router,
} from '@angular/router';
import { AuthService } from '@services';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class AuthGuard implements CanActivate {
  constructor(
    private router: Router,
    private authService: AuthService
  ) {}

  canActivate(
    next: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): Observable<boolean> | Promise<boolean> | boolean {
    const redirectUrl = encodeURI(state.url);
    this.authService.setRedirectUrl(redirectUrl);

    if (localStorage.getItem('token')) {
      return true;
    }

    // navigate to login page
    this.router.navigate(['/login'], {queryParams: {redirectUrl}});
    return false;
  }
}
