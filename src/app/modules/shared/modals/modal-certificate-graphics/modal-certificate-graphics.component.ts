import { Component, OnInit } from '@angular/core';

// Models
import { MetadataCertificateGraphicsModel } from '@models';

// Modals
import { BsModalRef } from 'ngx-bootstrap/modal';

@Component({
  selector: 'app-modal-certificate-graphics',
  templateUrl: './modal-certificate-graphics.component.html',
  styleUrls: ['./modal-certificate-graphics.component.scss']
})
export class ModalCertificateGraphicsComponent implements OnInit {
  public certificateGraphics: MetadataCertificateGraphicsModel[]; // Input data
  public graphicsList: MetadataCertificateGraphicsModel[] = [];

  constructor(
    private bsModalRef: BsModalRef,
  ) { }

  ngOnInit(): void {
    this.getGraphicsList();
  }

  getGraphicsList() {
    this.graphicsList = (Array.isArray(this.certificateGraphics) && this.certificateGraphics.length)
      ? this.certificateGraphics.filter(item => item?.file || item?.preview_image)
      : [];
  }

  closeModal() {
    this.bsModalRef.hide();
  }
}
