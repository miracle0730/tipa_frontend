import {
  MainCategoryNamesModel,
  StageItem,
  ManufacturingTechniqueModel,
  CertificateModel,
  StreamTypesModel,
  StreamModel,
  FilmGradeModel,
  CertificationTypeNamesModel,
  CertificationTypeModel,
  RfqFormModeModel,
  RfqFormModeNamesModel,
  RfqFormTypeNamesModel,
  StageItemIdsModel,
  LevelOfClearanceIdsModel,
  LevelOfClearanceModel,
  CertificateTypeIdsModel,
  CertificateTypeModel,
  CertificateAvailableForIdsModel,
  CertificateAvailableForModel,
  CertificateThicknessNamesModel,
} from '@models';

export class AppConstants {
  public static get StageItemIds(): StageItemIdsModel {
    return {
      COMMERCIAL: 1,
      UNDER_DEVELOPMENT: 2,
      FUTURE_DEVELOPMENT: 3,
      PARTNERS: 4,
    };
  }

  public static get StageItemList(): StageItem[] {
    return [
      {
        id: this.StageItemIds.COMMERCIAL,
        title: 'Commercial',
        level: 1,
        color: '--success'
      },
      {
        id: this.StageItemIds.UNDER_DEVELOPMENT,
        title: 'Under development',
        level: 2,
        color: '--warning'
      },
      {
        id: this.StageItemIds.FUTURE_DEVELOPMENT,
        title: 'Future development',
        level: 3,
        color: '--danger'
      },
      {
        id: this.StageItemIds.PARTNERS,
        title: 'Partners',
        level: 4,
        color: '--partner'
      }
    ];
  }

  public static get LevelOfClearanceIds(): LevelOfClearanceIdsModel {
    return {
      PUBLIC_TO_ALL: 1,
      VISIBLE_IN_PRO_AND_ONLY_ADMIN_IN_GENERATOR: 2,
      ADMIN_LEVEL_ONLY: 3,
    };
  }

  public static get LevelOfClearanceList(): LevelOfClearanceModel[] {
    return [
      {
        id: this.LevelOfClearanceIds.PUBLIC_TO_ALL,
        title: 'Public to all',
        level: 1,
      },
      {
        id: this.LevelOfClearanceIds.VISIBLE_IN_PRO_AND_ONLY_ADMIN_IN_GENERATOR,
        title: 'Visible in Pro, only Admin in generator',
        level: 2,
      },
      {
        id: this.LevelOfClearanceIds.ADMIN_LEVEL_ONLY,
        title: 'Admin level only',
        level: 3,
      },
    ];
  }

  public static get CertificateTypeIds(): CertificateTypeIdsModel {
    return {
      INDUSTRIAL_COMPOSTABLE: 1,
      HOME_COMPOSTABLE: 2,
      TIPA_CERTIFIED: 3,
    };
  }

  public static get CertificateTypeList(): CertificateTypeModel[] {
    return [
      {
        id: this.CertificateTypeIds.INDUSTRIAL_COMPOSTABLE,
        title: 'Industrial Compostable',
      },
      {
        id: this.CertificateTypeIds.HOME_COMPOSTABLE,
        title: 'Home Compostable',
      },
      {
        id: this.CertificateTypeIds.TIPA_CERTIFIED,
        title: 'TIPA Certified',
      },
    ];
  }

  public static get CertificateAvailableForIds(): CertificateAvailableForIdsModel {
    return {
      APPLICATIONS: 1,
      PRODUCTS: 2,
    };
  }

  public static get CertificateAvailableForList(): CertificateAvailableForModel[] {
    return [
      {
        id: this.CertificateAvailableForIds.APPLICATIONS,
        title: 'Applications',
      },
      {
        id: this.CertificateAvailableForIds.PRODUCTS,
        title: 'Products',
      },
    ];
  }

  public static get CertificateThicknessNames(): CertificateThicknessNamesModel {
    return {
      ALL_THICKNESS: 'All thickness',
    };
  }

  public static get ManufacturingTechniqueList(): ManufacturingTechniqueModel[] {
    return [
      {
        id: 1,
        title: 'Cast',
      },
      {
        id: 2,
        title: 'Blown',
      }
    ];
  }

  public static get FilmGradeList(): FilmGradeModel[] {
    return [
      {
        id: 1,
        title: 'Food grade'
      },
      {
        id: 2,
        title: 'Dry food'
      },
      {
        id: 3,
        title: 'Non food'
      },
    ];
  }

  public static get MainCategoryNames(): MainCategoryNamesModel {
    return {
      APPLICATION: {
        level: 1,
        title: 'Application'
      },
      PRODUCT_FAMILY: {
        level: 1,
        title: 'Product Family'
      },
      SEGMENTS: {
        level: 1,
        title: 'Segments'
      },
      APPLICATION_TYPE: {
        level: 1,
        title: 'Application type'
      },
      ADDITIONAL_FEATURES: {
        level: 1,
        title: 'Additional features'
      },
      CORE: {
        level: 1,
        title: 'Core'
      },
      COMPOSTABILITY_LOGOS: {
        level: 1,
        title: 'Compostability logos'
      },
      FOOD_CONTACTS: {
        level: 1,
        title: 'Food contacts'
      },
      CERTIFIED_BY: {
        level: 1,
        title: 'Certified By'
      },
      CERTIFICATES: {
        level: 1,
        title: 'Certificates'
      },
      PARTNERS: {
        level: 1,
        title: 'Partners'
      },
      TERRITORIES: {
        level: 1,
        title: 'Territories'
      },
      MEASURE_UNIT: {
        level: 1,
        title: 'Measure Unit'
      },
      PRINTING_METHOD: {
        level: 1,
        title: 'Printing Method'
      },
    };
  }

  public static get CertificationTypeNames(): CertificationTypeNamesModel {
    return {
      INDUSTRIAL: 'industrial',
      HOME: 'home',
      FOOD: 'food',
    };
  }

  public static get CertificationTypeList(): CertificationTypeModel[] {
    return [
      {
        type: this.CertificationTypeNames.INDUSTRIAL,
        title: 'Industrial',
      },
      {
        type: this.CertificationTypeNames.HOME,
        title: 'Home',
      },
      {
        type: this.CertificationTypeNames.FOOD,
        title: 'Food',
      },
    ];
  }

  public static get DisplayPriorityList(): number[] {
    let list: number[] = []; // 1 - 100
    for (let i = 1; i <= 100; i++) {
      list.push(i);
    }

    return list;
  }

  public static get RfqFormTypeNames(): RfqFormTypeNamesModel {
    return {
      FAST_TRACK: 'fast_track',
      CUSTOM: 'custom',
    };
  }

  public static get RfqFormModeNames(): RfqFormModeNamesModel {
    return {
      FULL: 1,
      SIMPLIFIED: 2,
    };
  }

  public static get RfqFormModeList(): RfqFormModeModel[] {
    return [
      {
        id: this.RfqFormModeNames.FULL,
        title: 'Applications & Printed Reels',
      },
      {
        id: this.RfqFormModeNames.SIMPLIFIED,
        title: 'Unprinted films',
      },
    ];
  }

  public static get StreamTypes(): StreamTypesModel {
    return {
      CUSTOM: 'custom',
      FAST_TRACK: 'fast_track',
      STOCK: 'stock',
    };
  }

  public static get StreamList(): StreamModel[] {
    return [
      {
        type: this.StreamTypes.CUSTOM,
        title: 'Custom',
        file_url: null,
        site_url: null,
        checked: false,
      },
      {
        type: this.StreamTypes.FAST_TRACK,
        title: 'Fast track',
        file_url: null,
        site_url: null,
        checked: false,
      },
      {
        type: this.StreamTypes.STOCK,
        title: 'Stock',
        file_url: null,
        site_url: null,
        checked: false,
      },
    ];
  }
}
