import * as ProductActions from './product.actions';
import { ProductModel } from 'src/app/models';
import * as _ from 'lodash';

export interface State {
  allProducts: ProductModel[];
  productInfo: ProductModel;
  allProductsLoaded: boolean;
  error: any;
  keepScrollY: number;
}

const initialState: State = {
  allProducts: [],
  productInfo: null,
  allProductsLoaded: false,
  error: null,
  keepScrollY: 0,
};

export function productReducer(
  state = initialState,
  action: ProductActions.ProductActions
) {
  switch (action.type) {
    case ProductActions.SET_ALL_PRODUCTS:
      return {
        ...state,
        allProducts: getSortedProducts([...action.payload]),
        allProductsLoaded: true,
        error: null,
      };
    case ProductActions.SET_PRODUCT:
      return {
        ...state,
        productInfo: { ...action.payload },
      };
    case ProductActions.ADD_PRODUCT:
      return {
        ...state,
        allProducts: getSortedProducts([...state.allProducts, action.payload]),
      };
    case ProductActions.UPDATE_PRODUCT:
      const copyAllProducts = [...state.allProducts];
      const copyNewProduct = { ...action.payload.newProduct };

      const indexProduct = copyAllProducts.findIndex(
        (item) => item.id === action.payload.productId
      );

      copyAllProducts[indexProduct] = copyNewProduct;

      return {
        ...state,
        allProducts: getSortedProducts([...copyAllProducts]),
        productInfo: copyNewProduct,
      };
    case ProductActions.DELETE_PRODUCT:
      return {
        ...state,
        allProducts: state.allProducts.filter((product, index) => {
          return product.id !== action.payload;
        }),
        productInfo: null,
      };
    case ProductActions.FETCH_PRODUCT:
      return {
        ...state,
        productInfo: null,
      };
    case ProductActions.ERROR_PRODUCT:
      return {
        ...state,
        error: { ...action.payload },
        allProductsLoaded: false,
      };
    case ProductActions.KEEP_SCROLL_Y_PRODUCT:
      return {
        ...state,
        keepScrollY: action.payload,
      };
    default:
      return state;
  }
}

function getSortedProducts(products: ProductModel[]): ProductModel[] {
  let sortedProducts = _.orderBy(products, ['display_priority', 'title'], ['asc', 'asc']);
  
  return JSON.parse(JSON.stringify([...sortedProducts]));
}
