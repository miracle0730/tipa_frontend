import {Component, Input, OnChanges, SimpleChanges} from '@angular/core';
import {
  NgxGalleryImage, NgxGalleryImageSize,
  NgxGalleryOptions,
} from '@kolkov/ngx-gallery';

@Component({
  selector: 'app-gallery',
  templateUrl: './gallery.component.html',
  styleUrls: ['./gallery.component.scss']
})
export class GalleryComponent implements OnChanges {
  galleryOptions: NgxGalleryOptions[];
  galleryImages: NgxGalleryImage[];
  @Input() images: string[];

  constructor() {
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes) {
      if (changes.images && changes.images.currentValue) {
        this.images = changes.images.currentValue;
        this.galleryInit();
      }
    }
  }

  galleryInit() {
    if (!Array.isArray(this.images)) {
      return;
    }
    this.galleryImages = this.images.map(img => {
      return {
        medium: img,
        big: img
      };
    });
    this.galleryOptions = [
      {
        imageArrows: false,
        previewArrows: false,
        previewZoom: true,
        thumbnails: false,
        imageSize: NgxGalleryImageSize.Contain, // Cover
        previewCloseOnClick: true,
        previewCloseOnEsc: true
      },
    ];
  }
}
