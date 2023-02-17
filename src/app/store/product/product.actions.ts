import { Action } from '@ngrx/store';
import { ProductModel, CategoryModel } from 'src/app/models';

export const FETCH_ALL_PRODUCTS = '[Products] Fetch Products';
export const SET_ALL_PRODUCTS = '[Products] Set Products';
export const FETCH_PRODUCT = '[Products] Fetch Product';
export const SET_PRODUCT = '[Products] Set Product';
export const ADD_PRODUCT = '[Products] Add Product';
export const UPDATE_PRODUCT = '[Products] Update Product';
export const DELETE_PRODUCT = '[Products] Delete Product';
export const ERROR_PRODUCT = '[Products] Error Product';
export const KEEP_SCROLL_Y_PRODUCT = '[Products] Keep Scroll Y Product';

export class FetchAllProducts implements Action {
  readonly type = FETCH_ALL_PRODUCTS;
}
export class FetchProduct implements Action {
  readonly type = FETCH_PRODUCT;

  constructor(public payload: number) {}
}

export class SetAllProducts implements Action {
  readonly type = SET_ALL_PRODUCTS;

  constructor(public payload: ProductModel[]) {}
}
export class SetProduct implements Action {
  readonly type = SET_PRODUCT;

  constructor(public payload: ProductModel) {}
}

export class AddProduct implements Action {
  readonly type = ADD_PRODUCT;

  constructor(public payload: ProductModel) {}
}

export class UpdateProduct implements Action {
  readonly type = UPDATE_PRODUCT;

  constructor(
    public payload: { productId: number; newProduct: ProductModel }
  ) {}
}

export class DeleteProduct implements Action {
  readonly type = DELETE_PRODUCT;

  constructor(public payload: number) {}
}

export class ErrorProduct implements Action {
  readonly type = ERROR_PRODUCT;

  constructor(public payload: any) {}
}

export class KeepScrollYProduct implements Action {
  readonly type = KEEP_SCROLL_Y_PRODUCT;

  constructor(public payload: number) {}
}

export type ProductActions =
  | FetchAllProducts
  | FetchProduct
  | SetAllProducts
  | SetProduct
  | AddProduct
  | UpdateProduct
  | DeleteProduct
  | ErrorProduct
  | KeepScrollYProduct;
