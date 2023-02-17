import { Component, OnInit } from '@angular/core';
import {
  FormGroup,
  FormBuilder,
  FormControl,
  Validators,
} from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { Router, ActivatedRoute } from '@angular/router';
import { Store } from '@ngrx/store';
import { AlertService, AuthService, AmplitudeService } from '@services';
import { AuthResponse } from '@models';

import * as fromApp from '@store/app.reducer';
import * as ProfileActions from '@store/profile/profile.actions';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'],
})
export class LoginComponent implements OnInit {
  public loginForm: FormGroup;
  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private formBuilder: FormBuilder,
    private authService: AuthService,
    private alertService: AlertService,
    private amplitudeService: AmplitudeService,
    private store: Store<fromApp.AppState>
  ) {
    this.loginForm = this.formBuilder.group({
      email: new FormControl('', [Validators.required, Validators.email]),
      password: new FormControl('', [Validators.required]),
    });
  }

  ngOnInit() {}

  login() {
    this.authService.login(this.loginForm.value).subscribe(
      (response: AuthResponse) => {
        this.getRedirectUrl((redirectUrl: string) => {
          this.store.dispatch(new ProfileActions.SetProfile(response));
          this.authService.storeTokens(response.tokens);
          this.router.navigateByUrl(redirectUrl);
          this.amplitudeService.addNewEvent('Login event', {
            email: response.email,
            id: response.id,
            name: response.fullname,
          });
        });
      },
      (err: HttpErrorResponse) => {
        this.alertService.showError(err.error.message);
      }
    );
  }

  getRedirectUrl(callback) {
    this.route.queryParams.subscribe(params => {
      // const redirectUrl = params.redirectUrl;
      const redirectUrl = this.authService.getRedirectUrl();
      if (redirectUrl) {
        callback(decodeURI(redirectUrl));
      } else {
        callback('/products');
      }
    });
  }
}
