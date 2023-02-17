import { Component, OnInit } from '@angular/core';
import { BsModalRef } from 'ngx-bootstrap/modal';

@Component({
  selector: 'app-modal-pdf-viewer',
  templateUrl: './modal-pdf-viewer.component.html',
  styleUrls: ['./modal-pdf-viewer.component.scss']
})
export class ModalPdfViewerComponent implements OnInit {
  public pdfSrc: string;

  constructor(
    private bsModalRef: BsModalRef,
  ) { }

  ngOnInit(): void {
  }

  closeModal() {
    this.bsModalRef.hide();
  }
}
