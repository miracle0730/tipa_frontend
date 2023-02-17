import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { ImageModel } from '@models';
import { FileService } from '@services';

import * as _ from 'lodash';

@Component({
  selector: 'app-edit-images',
  templateUrl: './edit-images.component.html',
  styleUrls: ['./edit-images.component.scss'],
})
export class EditImagesComponent implements OnInit {
  public copyImages: ImageModel[] = [];
  public copyFiles: any[] = [];
  public newImages: (Blob | File)[] = [];

  public newImagesPreview = [];

  @Input() images: ImageModel[];
  @Input() singleImage: boolean;
  @Output() addFile = new EventEmitter();

  constructor(private fileService: FileService) {}

  ngOnInit() {
    this.copyImages = (this.images && Array.isArray(this.images)) ? _.cloneDeep(this.images) : [];
  }

  onFileChanged(event) {
    if (event.target.files.length > 0) {
      const files = [...event.target.files];
      this.copyFiles.push(...files);

      this.previewAllImages(files).then((previewImages: any[]) => {
        previewImages.forEach((item) => {
          this.newImagesPreview.push(item);
        });

        this.fileService.compressAllImages(this.copyFiles).then((newImages) => {
          this.newImages = newImages;
          this.addFile.emit({
            oldImages: this.copyImages,
            newImages: this.newImages,
          });
        });
      });
    }
  }

  previewImage(file: File) {
    return new Promise((resolve, reject) => {
      const mimeType = file.type;
      if (mimeType.match(/image\/*/) == null) {
        return;
      }
      const reader = new FileReader();
      reader.readAsDataURL(file);

      reader.onload = (event) => {
        const url = reader.result as string;
        resolve({ id: null, url });
      };
    });
  }

  previewAllImages(files: File[]) {
    return Promise.all(
      files.map((file) => {
        return this.previewImage(file);
      })
    );
  }

  deleteOldImage(index: number) {
    _.remove(this.copyImages, (image, imIndex) => imIndex === index);
    this.addFile.emit({
      oldImages: this.copyImages,
      newImages: this.newImages,
    });
  }

  deleteNewImage(index: number) {
    _.remove(this.newImages, (image, imIndex) => imIndex === index);
    _.remove(this.newImagesPreview, (image, imIndex) => imIndex === index);
    _.remove(this.copyFiles, (image, imIndex) => imIndex === index);
    this.addFile.emit({
      oldImages: this.copyImages,
      newImages: this.newImages,
    });
  }

  getUniqFiles(files: File[]) {
    return _.uniqBy(files, (file: File) => file.name);
  }
}
