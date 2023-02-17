import {ImageModel} from '@models';

export interface CategoryModel {
  id: number;
  parent_id: number;
  level: number;
  title: string;
  createdAt: string;
  updatedAt: string;
  metadata: CategoryMetadataModel;
}

export interface CategoryMetadataModel {
  hints?: MetadataHintModel[]; // for additional features with level 3
  film_grade?: number; // for packed goods with level 4
  certification_type?: string; // for compostability logos with level 2
  certification_logo?: string | ImageModel; // for compostability logos with level 2
  certification_file?: string | ImageModel; // for compostability logos with level 3
  // application_type
  application_type_display_priority?: number; // for application type with level 2
  application_type_logo?: string | ImageModel; // for application type with level 2
  // product_family
  product_family_display_priority?: number; // for product family with level 2
  product_family_logo?: string | ImageModel; // for product family with level 2
  // certificates
  certificate_type?: number; // for certificates with level 2
  certificate_logo?: string | ImageModel; // for certificates with level 2
  certificate_available_for?: number[]; // for certificates with level 2
  certificate_certified_by?: number; // for certificates with level 2
  certificate_file?: string | ImageModel; // for certificates with level 2
  certificate_graphics?: MetadataCertificateGraphicsModel[]; // for certificates with level 2
  // certified_by
  certified_by_website?: string; // for certified_by with level 2
  certified_by_relevant_locations?: string;
  // partners
  partner_owner?: string; // for partners with level 2
  zoho_id?: string; // for partners with level 2
}

export interface MetadataHintModel {
  title: string;
}

export interface MetadataCertificateGraphicsModel {
  file: any | string | ImageModel;
  preview_image: any | string | ImageModel;
}

export interface SideMenuModel {
  id: number;
  parent_id: number;
  level: number;
  title: string;
  createdAt: string;
  updatedAt: string;
  nestedCategories: SideMenuModel[];
  active: boolean;
  collapsed: boolean;
}

export interface MultiSelectModel {
  id: number;
  title: string;
}

export interface StreamSelectModel {
  type: string;
  title: string;
}

export interface FilterSelectModel {
  stageListSelected: MultiSelectModel[];
  streamListSelected: StreamSelectModel[];
  applicationListSelected: MultiSelectModel[];
  applicationTypeSelected: MultiSelectModel[];
  productFamilySelected: MultiSelectModel[];
  productFilteredSelected: MultiSelectModel[];
  segmentSelected: MultiSelectModel[];
  segmentTypeSelected: MultiSelectModel[];
  packetGoodsSelected: MultiSelectModel[];
}

export interface ProductsFilterModel {
  stageListSelected: MultiSelectModel[];
  territoryListSelected: MultiSelectModel[];
}

export interface ShowFastTrack {
  active: boolean;
}