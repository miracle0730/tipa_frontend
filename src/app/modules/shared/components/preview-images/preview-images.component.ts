import { Component, OnInit, Input, OnChanges } from '@angular/core';
import { ImageModel } from '@models';

@Component({
  selector: 'app-preview-images',
  templateUrl: './preview-images.component.html',
  styleUrls: ['./preview-images.component.scss'],
})
export class PreviewImagesComponent implements OnInit, OnChanges {
  public previewImage: string;
  @Input() images: ImageModel[];
  constructor() {}

  ngOnInit() {}

  ngOnChanges() {
    if (this.images.length > 1) {
      this.previewImage = this.images[0].url;
    }
  }

  previewImageEvent(image: ImageModel) {
    this.previewImage = image.url;
  }
}
