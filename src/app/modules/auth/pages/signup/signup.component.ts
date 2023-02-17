import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormGroup, FormBuilder, FormControl, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';

// Services
import { AlertService, AuthService } from '@services';

// Libraries
import { Subscription } from 'rxjs';
import jwt_decode from "jwt-decode";

enum signupStepsEnum {
  startSignup = 1, // Send email
  finishSignup = 2, // Set password
}

@Component({
  selector: 'app-signup',
  templateUrl: './signup.component.html',
  styleUrls: ['./signup.component.scss']
})
export class SignupComponent implements OnInit, OnDestroy {
  private queryParamsSubscription: Subscription;

  public form: FormGroup;
  public signupStepsEnum = signupStepsEnum;
  public signupStep: number;
  public token: string;
  public email: string;

  constructor(
    private authService: AuthService,
    private alertService: AlertService,
    private formBuilder: FormBuilder,
    private activeRouter: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.queryParamsSubscription = this.activeRouter.queryParams.subscribe(
      (params) => {
        if (params.token) { // Finish signup
          this.token = params.token;

          try {
            let decoded = jwt_decode(this.token);
            this.email = decoded['email'];
          } catch (err) {
            this.alertService.showError('Token is invalid');
            this.router.navigate(['/signup']);
          }

          this.signupStep = this.signupStepsEnum.finishSignup;
          this.initForm(this.signupStep);
        } else { // Start signup
          this.signupStep = this.signupStepsEnum.startSignup;
          this.initForm(this.signupStep);
        }
      }
    );
  }

  ngOnDestroy() {
    if (this.queryParamsSubscription) {
      this.queryParamsSubscription.unsubscribe();
    }
  }

  initForm(signupStep: number) {
    switch(signupStep) {
      case this.signupStepsEnum.startSignup:
        this.form = this.formBuilder.group({
          email: new FormControl('', [Validators.required, Validators.email])
        });
        break;
      case this.signupStepsEnum.finishSignup:
        this.form = this.formBuilder.group({
          password: new FormControl('', [Validators.required, Validators.minLength(8), Validators.maxLength(50)]),
          confirmPassword: new FormControl('', [Validators.required, Validators.minLength(8), Validators.maxLength(50)]),
        }, { 
          validator: this.confirmedValidator('password', 'confirmPassword')
        });
        break;
    }
  }

  confirmedValidator(controlName: string, matchingControlName: string) {
    return (formGroup: FormGroup) => {
        const control = formGroup.controls[controlName];
        const matchingControl = formGroup.controls[matchingControlName];
        if (matchingControl.errors && !matchingControl.errors.confirmedValidator) {
            return;
        }
        if (control.value !== matchingControl.value) {
            matchingControl.setErrors({ confirmedValidator: true });
        } else {
            matchingControl.setErrors(null);
        }
    }
  }

  startSignup() {
    this.authService.signupStart(this.form.value).subscribe(
      (res) => {
        this.alertService.showSuccess(res['message']);
      },
      (err: HttpErrorResponse) => {
        if (err.error.hasOwnProperty('errors')) {
          this.alertService.showError('Email must be an email');
        } else {
          this.alertService.showError(err.error.message);
        }
      }
    );
  }

  finishSignup() {
    let data = {
      email: this.email,
      password: this.form.value.password
    };
    this.authService.signupFinish(data, this.token).subscribe(
      (res) => {
        this.alertService.showSuccess(res['message']);
        this.router.navigate(['/login']);
      },
      (err: HttpErrorResponse) => {
        this.alertService.showError(err.error.message);
      }
    );
  }
}
