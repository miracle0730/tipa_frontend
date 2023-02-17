import { Component, OnInit } from '@angular/core';

// Models
import { CertificateModel, CertificateFilesModel, } from '@models';

// Modals
import { BsModalRef } from 'ngx-bootstrap/modal';

@Component({
  selector: 'app-certificate-files',
  templateUrl: './certificate-files.component.html',
  styleUrls: ['./certificate-files.component.scss']
})
export class CertificateFilesComponent implements OnInit {
  public certificate: CertificateModel;
  public files: CertificateFilesModel[] = [];

  constructor(
    private bsModalRef: BsModalRef,
  ) { }

  ngOnInit(): void {
    this.getFiles();
  }

  getFiles() {
    this.files = (this.certificate && this.certificate.files && this.certificate.files.length)
      ? [...this.certificate.files].filter(item => item)
      : [];
  }

  closeModal() {
    this.bsModalRef.hide();
  }
}
