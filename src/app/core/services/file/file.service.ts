import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import {
  ImageModel,
  PreasignUploadFields,
  PreasignImagesModel,
} from 'src/app/models';
import { environment } from '../../../../environments/environment';
import imageCompression from 'browser-image-compression';

@Injectable({
  providedIn: 'root',
})
export class FileService {
  private url = environment.url;
  private runTimes = 0;
  constructor(private http: HttpClient) {}

  /**
   * Gets product images
   * @returns array of images
   */
  getPreassignImages(
    fileName: string,
    contentType: string,
    queryParams: { key: string; value: string }[]
  ) {
    let params = new HttpParams();
    queryParams.forEach((param) => {
      params = params.append(param.key, param.value);
    });
    return this.http.post(
      `${this.url}/api/v1/presign-upload/`,
      {
        fileName,
        contentType,
      },
      { params }
    );
  }

  uploadImages(url: string, params: PreasignUploadFields, file: File) {
    const formData = new FormData();
    if (params && params.key && typeof params.key === 'string') {
      let splitted: any[] = params.key.split('/');
      let first: string = (splitted && splitted.length) ? String(splitted[0]) : '';
      
      if (first.includes('certificates')) {
        // this header need, for download file without redirect (open in new tab, if different domain)
        // so we can download file like <a [href]="fileUrl" [download]="fileName">Download</a>
        formData.append('Content-Disposition', 'attachment;');
      }
    }


    formData.append('Policy', params.Policy);
    formData.append('X-Amz-Algorithm', params['X-Amz-Algorithm']);
    formData.append('X-Amz-Credential', params['X-Amz-Credential']);
    formData.append('X-Amz-Date', params['X-Amz-Date']);
    formData.append('X-Amz-Signature', params['X-Amz-Signature']);
    formData.append('bucket', params.bucket);
    formData.append('key', params.key);
    formData.append('ACL', params.acl);
    formData.append('Content-Type', params['Content-Type']);
    formData.append('file', file);

    return this.http.post(url, formData);
  }

  promiseForUploadImage(file: File, query, tryCnt = 0) {
    return new Promise((resolve, reject) => {
      this.getPreassignImages(file.name, file.type, query).subscribe(
        (response: PreasignImagesModel) => {
          this.uploadImages(response.url, response.fields, file).subscribe(
            () => {
              const imageId = response.fields.key.split('/').pop();
              resolve(imageId);
            },
            (err) => {
              if(err.status ==  503){
                  console.log('E0', err.status);
                  //this.promiseForUploadImage(file, query, ++tryCnt);
                  this.uploadImages(response.url, response.fields, file).subscribe(
                      () => {
                          const imageId = response.fields.key.split('/').pop();
                          resolve(imageId);
                      },
                      (err) => {
                          if(err.status ==  503){
                              console.log('E1', err.status);
                              //this.promiseForUploadImage(file, query, ++tryCnt);
                              this.uploadImages(response.url, response.fields, file).subscribe(
                                  () => {
                                      const imageId = response.fields.key.split('/').pop();
                                      resolve(imageId);
                                  },
                                  (err) => {
                                      if(err.status ==  503){
                                          console.log('E2', err.status);
                                          this.uploadImages(response.url, response.fields, file).subscribe(
                                              () => {
                                                  const imageId = response.fields.key.split('/').pop();
                                                  resolve(imageId);
                                              },
                                              (err) => {
                                                  if(err.status ==  503){
                                                      console.log('E3', err.status);
                                                      this.uploadImages(response.url, response.fields, file).subscribe(
                                                          () => {
                                                              const imageId = response.fields.key.split('/').pop();
                                                              resolve(imageId);
                                                          },
                                                          (err) => {
                                                              if(err.status ==  503){
                                                                  console.log('E4', err.status);
                                                                  this.uploadImages(response.url, response.fields, file).subscribe(
                                                                      () => {
                                                                          const imageId = response.fields.key.split('/').pop();
                                                                          resolve(imageId);
                                                                      },
                                                                      (err) => {
                                                                          reject(err);
                                                                      }
                                                                  );
                                                              }
                                                              else {
                                                                  reject(err);
                                                              }
                                                          }
                                                      );
                                                  }
                                                  else {
                                                      reject(err);
                                                  }
                                              }
                                          );
                                      }
                                      else {
                                          reject(err);
                                      }
                                  }
                              );
                          }
                          else {
                              reject(err);
                          }
                      }
                  );
              }
              else {
                  reject(err);
              }
            }
          );
        },
        (err) => {
          reject(err);
        }
      );
    });
  }

  uploadAllNewImages(files: File[], queryParams) {
    const asyncImageUpload = async (file, query) => {
      // const d = this.runTimes++ > 2  ? (this.runTimes - 1)* 1000 : 0;
      // await delay(d);
      // console.log('ms', d, this.runTimes);
      return this.promiseForUploadImage(file, query);
    };

    const delay =  async(ms) =>{
        return new Promise( resolve => setTimeout(resolve, ms) );
    }


    const getAllImages = async () => {
      return Promise.all(
        files.map((file, index) => {
          return asyncImageUpload(file, queryParams);
        })
      );
    };

    return getAllImages();
  }

  filterImageArray(images: ImageModel[]) {
    return images
      .filter((image: ImageModel) => image.id)
      .map((item: ImageModel) => item.id);
  }

  compressAllImages(files: File[]) {
    return Promise.all(
      files.map((file) => {
        return this.compressImage(file);
      })
    );
  }

  compressImage(file: File) {
    const options = {
      maxWidthOrHeight: 1200,
      useWebWorker: true,
    };

    return imageCompression(file, options);
  }
}
