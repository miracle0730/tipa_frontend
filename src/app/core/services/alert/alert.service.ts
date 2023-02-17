import { Injectable } from '@angular/core';
import { ToastrService } from 'ngx-toastr';

@Injectable({
  providedIn: 'root',
})
export class AlertService {
  constructor(private toast: ToastrService) {}

  showSuccess(message) {
    this.toast.success(message, 'Success!');
  }

  showError(message) {
    this.toast.error(message, 'Error');
  }
}
