import {CertificateModel, CertificatesModel, StreamModel,} from '@models';
import {ThicknessFieldItem} from "../modules/shared/modals";

export interface ApplicationModel {
  id: number;
  type: number;
  stage: number;
  level_of_clearance: number;
  display_priority: number;
  description: string;
  images: any[];
  application: number[];
  segment: number[];
  segment_type: number[];
  packed_goods: number[];
  product: number[];
  thickness: any[];
  width: any[];
  height: any[];
  additional_features: any[];
  terms_and_limitations: string;
  production_process: string;
  tipa_production_site: string;
  technical_considerations: any;
  features: string;
  positive_experiments: string;
  negative_feedback_to_be_aware_of: string;
  dieline: any;
  customers: CustomerModel[];
  rtf: string;
  collaterals: CertificationfilesModel[];
  certifications: CertificateModel[];
  certificates: CertificatesModel[];
  streams: StreamModel[];
  available_marketing_samples: CustomerModel[];
  draft: boolean;
  fast_track: {
    application_number: string;
    thickness: any[];
    additional_features: any[];
    number_of_printing_colors: number[];
    production_site: string;
    dimensions: FtDimensionsModel[];
    items: FtItemsModel[];
  };
  created_at: string;
  updated_at: string;
  searchKey?: string;

  printing_method?: ThicknessFieldItem[];
  partner_name?: number[];
  production_site?: string;
  notes_area?: string;
}

export interface CustomerModel {
  images: any[];
  description: string;
}

export interface CertificationfilesModel {
  url: any; // string | File
}

export interface FtDimensionsModel {
  size: number;
  width: number;
  height: number;
  flap: number;
  gusset: number;
  dieline_url: any;
}

export interface FtItemsModel {
  visible: boolean;
  code: string;
  dimension: FtDimensionsModel;
  thickness: number;
  color: number;
  moq: number;
}

export interface GetApplicationsParamsModel {
  associated?: boolean;
  rfq_page?: boolean;
}

export interface ApplicationInfoPageQueryParamsKeysModel {
  tabIndex?: string;
}
