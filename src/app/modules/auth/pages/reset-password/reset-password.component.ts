import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormGroup, FormBuilder, FormControl, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';

// Services
import { AlertService, AuthService } from '@services';

// Libraries
import { Subscription } from 'rxjs';
import jwt_decode from "jwt-decode";

enum resetStepsEnum {
  step1 = 1, // Send email
  step2 = 2, // Set password
}

@Component({
  selector: 'app-reset-password',
  templateUrl: './reset-password.component.html',
  styleUrls: ['./reset-password.component.scss']
})
export class ResetPasswordComponent implements OnInit, OnDestroy {
  private queryParamsSubscription: Subscription;

  public form: FormGroup;
  public resetStepsEnum = resetStepsEnum;
  public resetStep: number;
  public step1SentEmail: boolean;
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
        if (params.token) { // Finish reset-password
          this.token = params.token;

          try {
            let decoded = jwt_decode(this.token);
            this.email = decoded['email'];
          } catch (err) {
            this.alertService.showError('Token is invalid');
            this.router.navigate(['/reset-password']);
          }

          this.resetStep = this.resetStepsEnum.step2;
          this.initForm(this.resetStep);
        } else { // Start reset-password
          this.resetStep = this.resetStepsEnum.step1;
          this.initForm(this.resetStep);
        }
      }
    );
  }

  ngOnDestroy() {
    if (this.queryParamsSubscription) {
      this.queryParamsSubscription.unsubscribe();
    }
  }

  initForm(resetStep: number) {
    switch(resetStep) {
      case this.resetStepsEnum.step1:
        this.form = this.formBuilder.group({
          email: new FormControl('', [Validators.required, Validators.email])
        });
        break;
      case this.resetStepsEnum.step2:
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

  saveStep1() {
    this.authService.resetPasswordStart(this.form.value).subscribe(
      (res) => {
        this.step1SentEmail = true;
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

  saveStep2() {
    let data = {
      email: this.email,
      password: this.form.value.password
    };
    this.authService.resetPasswordFinish(data, this.token).subscribe(
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
