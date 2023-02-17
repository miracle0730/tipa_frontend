import {ImageModel} from '@models';
import {ThicknessFieldItem} from '../modules/shared/modals';

export interface ProductModel {
  id: number;
  title: string;
  description: string;
  images: any[];
  family: number[];
  stage: number;
  level_of_clearance: number;
  display_priority: number;
  segment: number[];
  segment_type: number[];
  packed_goods: number[];
  application: number[];
  manufacturing_technique: number;
  printing_stage: number;
  thickness: any[];
  width: WidthModel[] | any;
  height: string;
  additional_features: AdditionalFeaturesModel[];
  features: string;
  terms_and_limitations: string;
  technical_considerations: any;
  barrier: any;
  printability: any;
  tds: TdsModel[];
  msds: MsdsModel[];
  moq: MOQModel[];
  rtf: string;
  certifications: CertificateModel[];
  certificates: CertificatesModel[];
  draft: boolean;
  created_at: string;
  updated_at: string;
  searchKey?: string;

  printing_method?: ThicknessFieldItem[];
  available_territories?: ThicknessFieldItem[];
  partner_name?: number[];
  production_site?: string;
  notes_area?: string;
}

export interface CertificatesModel {
  certificate_id: number;
  download_graphics: boolean;
  notes: string;
  thickness: (number | string)[];
}

export interface CertificateModel {
  file_url?: any;
  description?: string;
  download?: boolean;
  disabled?: boolean;
  category_id?: number;
  title?: string;
  type?: string;
  logo?: any | string | ImageModel;
  files?: CertificateFilesModel[];
  checked?: boolean;
  logo_ai?: string; // need delete after all changes
}

export interface CertificateFilesModel {
  title: string;
  file: any | string | ImageModel;
}

export interface WidthModel {
  stage: number;
  min: number;
  max: number;
  measure_unit: number[];
}

export interface MOQModel {
  moq: number;
  measure_unit: number[];
  notes: string;
}

export interface AdditionalFeaturesModel {
  ids: any[];
  stage: number; // 0 | 1 | 2
  mandatory: boolean;
}

export interface TdsModel {
  url: any; // string | File
}

export interface MsdsModel {
  url: any; // string | File
}

export interface GetProductsParamsModel {
  rfq_page?: boolean;
}
