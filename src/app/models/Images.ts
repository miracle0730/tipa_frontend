export interface PhotosResponse {
  newImages: File[];
  oldImages: ImageModel[];
}

export interface ImageModel {
  id: string;
  url: string;
}

export interface PreasignImagesModel {
  url: string;
  fields: PreasignUploadFields;
}

export interface PreasignUploadFields {
  key: string;
  bucket: string;
  acl: string;
  'X-Amz-Algorithm': string;
  'X-Amz-Credential': string;
  'X-Amz-Date': string;
  Policy: string;
  'X-Amz-Signature': string;
  'Content-Type': string;
}
