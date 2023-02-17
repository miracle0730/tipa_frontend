import { CategoryModel, FilmGradeModel, MultiSelectModel, } from '@models';

export interface RfqModel {
  type: string;
  form_mode: number;
  opportunity_section: OpportunitySection;
  rfq_section?: { // This section should be add only if there is a rfq_id parameter
    id: string;
    action: string;
  };
  feedback_section: FeedbackSection;
  segment_section: {
    segment: RfqShortItemModel;
    segment_type: RfqShortItemModel;
    packed_goods: RfqShortItemModel;
    expected_shelf_life: string;
  };
  application_section: {
    packaging: RfqShortItemModel;
    application: RfqShortItemModel;
    application_type: RfqShortItemModel;
    estimated_application_type: RfqShortItemModel;
  };
  product_section: {
    product_family: RfqShortItemModel;
    product: RfqShortItemModel;
    film_grade: string;
    thickness: number;
    manufacturing_technique: string;
  };
  additional_features_section: RfqModelAdditionalFeaturesSection[];
  dimensions_section: {
    width: number;
    height: number;
    flap: number;
    closed_gusset: number;
    core: RfqShortItemModel;
    reel_length_limitation: string;
    box_weight_limitation: string;
    od: string;
    reel_weight_limitation: string;
    cof: number;
  };
  graphics_section: {
    printing: boolean;
    digital_printing: boolean;
    number_of_colors: number;
    rtf: string;
    external_logo: GraphicsSectionExternalLogo[];
  };
  pricing_section: {
    currency: string;
    shipping_terms: string;
    pricing_measure_unit: string;
    imp_width: number;
    imp_height: number;
    moq: number;
    annual_quantity_potential: string;
    current_material_used: string;
    current_price_payed: number;
    items: PricingSectionItems[];
    remarks: string;
    fast_track_code?: string;               // field for Fast Track
    price_list?: PricingSectionPriceList[]; // field for Fast Track  
  };
  other_section: {
    rfq_is_for: string;
  };
}

export interface RfqFormModel {
  segment_section: {
    segment: CategoryModel[];
    segment_type: CategoryModel[];
    other_segment_type: string;
    packed_goods: CategoryModel[];
    other_packed_goods: string;
    expected_shelf_life: string;  
  };
  application_section: {
    search_by?: string;                       // field for Fast Track
    search_by_ft_code?: (any | string)[];     // field for Fast Track
    application_product?: MultiSelectModel[]; // field for Fast Track
    packaging: CategoryModel[];
    application: CategoryModel[];
    application_type: CategoryModel[];
    other_application_type: string;
    estimated_application_type: CategoryModel[];
    other_estimated_application_type: string;
  };
  product_section: {
    product_family: CategoryModel[];
    product: CategoryModel[];
    film_grade: FilmGradeModel[];
    thickness: any[];
    manufacturing_technique: string;
  };
  additional_features_section: RfqFormModelAdditionalFeaturesSection[];
  dimensions_section: {
    dimension?: any[]; // field for Fast Track
    width: number;
    height: number;
    flap: number;
    closed_gusset: number;
    core: CategoryModel[];
    reel_length_limitation: string;
    box_weight_limitation: string;
    od: string;
    reel_weight_limitation: string;
    cof: CofModel[];
  };
  graphics_section: {
    printing: boolean;
    digital_printing: boolean;
    number_of_colors: number[];
    rtf: string;
    external_logo: GraphicsSectionExternalLogo[];
  };
  pricing_section: {
    currency: string;
    shipping_terms: string[];
    pricing_measure_unit: any[];
    imp_width: number;
    imp_height: number;
    moq: string;
    annual_quantity_potential: string;
    current_material_used: string;
    current_price_payed: number;
    items: PricingSectionItems[];
    remarks: string;
    fast_track_code?: string;               // field for Fast Track
    price_list?: PricingSectionPriceList[]; // field for Fast Track
  };
  other_section: {
    rfq_is_for: string;
  };
}

export interface RfqShortItemModel {
  id: number;
  title: string;
}

export interface CofModel {
  id: number;
  title: number;
}

export interface GraphicsSectionExternalLogo {
  id: number;
  certificate_name: string;
  selected?: boolean;
}

export interface PricingSectionItems {
  quantity: number;
  price_per_unit: number | string;
  price_total: number | string;
  eur_cost: number;
  usd_cost: number;
  convertor_cost_eur: number;
  convertor_cost_usd: number;
  eur_price: number;
  moq_unit: number;
  moq_meter: number;
  moq_kg: number;
  moq_impression: number;
  usd_price: number;
  total_eur_price: number;
  total_usd_price: number;
  private_quantity_note?: string; // private property only for the UI
}

export interface PricingSectionPriceList {
  from_qty: number;
  to_qty: number;
  price_eur: number;
  price_usd: number;
}

export interface RfqModelAdditionalFeaturesSection {
  id: number;
  additional_feature: string;
  additional_feature_parent: string;
  additional_feature_hints: AdditionalFeatureHints[];
}

export interface RfqFormModelAdditionalFeaturesSection {
  parent: string;
  list: RfqFormModelAdditionalFeature[];
}

export interface RfqFormModelAdditionalFeature {
  stage: number;
  mandatory: boolean;
  selected: boolean;
  id: number;
  additional_feature: string;
  additional_feature_parent: string;
  additional_feature_hints: AdditionalFeatureHints[];
}

export interface AdditionalFeatureHints {
  hint_name: string;
  hint_value: string;
}

export interface OpportunitySection {
  id: string;
  accountName: string;
  name: string;
  owner: string;
  user_id: string;
}

export interface FeedbackSection {
  packed_goods: FeedbackSectionItem[];
  production: FeedbackSectionItem[];
  pricing: FeedbackSectionItem[];
}

export interface FeedbackSectionItem {
  title: string;
  checked: boolean;
}
