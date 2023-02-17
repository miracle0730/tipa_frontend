export interface MainCategoryNamesModel {
  APPLICATION: MainCategoryNamesItemModel;
  PRODUCT_FAMILY: MainCategoryNamesItemModel;
  SEGMENTS: MainCategoryNamesItemModel;
  APPLICATION_TYPE: MainCategoryNamesItemModel;
  ADDITIONAL_FEATURES: MainCategoryNamesItemModel;
  CORE: MainCategoryNamesItemModel;
  COMPOSTABILITY_LOGOS: MainCategoryNamesItemModel;
  FOOD_CONTACTS: MainCategoryNamesItemModel;
  CERTIFICATES: MainCategoryNamesItemModel;
  CERTIFIED_BY: MainCategoryNamesItemModel;
  PARTNERS: MainCategoryNamesItemModel;
  TERRITORIES: MainCategoryNamesItemModel;
  MEASURE_UNIT: MainCategoryNamesItemModel;
  PRINTING_METHOD: MainCategoryNamesItemModel;
}

export interface MainCategoryNamesItemModel {
  level: number;
  title: string;
}

export interface StageItemIdsModel {
  COMMERCIAL: number;
  UNDER_DEVELOPMENT: number;
  FUTURE_DEVELOPMENT: number;
  PARTNERS: number;
}

export interface StageItem {
  id: number;
  title: string;
  level: number;
  color: string;
}

export interface LevelOfClearanceIdsModel {
  PUBLIC_TO_ALL: number;
  VISIBLE_IN_PRO_AND_ONLY_ADMIN_IN_GENERATOR: number;
  ADMIN_LEVEL_ONLY: number;
}

export interface LevelOfClearanceModel {
  id: number;
  title: string;
  level: number;
}

export interface CertificateTypeIdsModel {
  INDUSTRIAL_COMPOSTABLE: number;
  HOME_COMPOSTABLE: number;
  TIPA_CERTIFIED: number;
}

export interface CertificateTypeModel {
  id: number;
  title: string;
}

export interface CertificateAvailableForIdsModel {
  APPLICATIONS: number;
  PRODUCTS: number;
}

export interface CertificateAvailableForModel {
  id: number;
  title: string;
}

export interface ManufacturingTechniqueModel {
  id: number;
  title: string;
}

export interface FilmGradeModel {
  id: number;
  title: string;
}

export interface CertificationTypeNamesModel {
  INDUSTRIAL: string;
  HOME: string;
  FOOD: string;
}

export interface CertificationTypeModel {
  type: string;
  title: string;
}

export interface CertificateThicknessNamesModel {
  ALL_THICKNESS: string;
}

export interface RfqFormTypeNamesModel {
  FAST_TRACK: string;
  CUSTOM: string;
}

export interface RfqFormModeNamesModel {
  FULL: number;
  SIMPLIFIED: number;
}

export interface RfqFormModeModel {
  id: number;
  title: string;
  checked?: boolean;
}

export interface StreamTypesModel {
  CUSTOM: string;
  FAST_TRACK: string;
  STOCK: string;
}

export interface StreamModel {
  type: string;
  title: string;
  file_url: any | string;
  site_url: string;
  checked: boolean;
}
