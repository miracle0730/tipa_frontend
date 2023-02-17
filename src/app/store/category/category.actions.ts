import { Action } from '@ngrx/store';
import { CategoryModel, ShowFastTrack } from '../../models/Category';

export const SET_CATEGORIES = '[Categories] Set Categories';
export const FETCH_CATEGORIES = '[Categories] Fetch Categories';
export const ADD_CATEGORY = '[Category] Add Category';
export const UPDATE_CATEGORY = '[Category] Update Category';
export const DELETE_CATEGORY = '[Category] Delete Category';
export const SHOW_FASTTRACK = '[Category] Show FastTrack';

export class SetCategories implements Action {
  readonly type = SET_CATEGORIES;

  constructor(public payload: CategoryModel[]) {}
}


export class FetchCategories implements Action {
  readonly type = FETCH_CATEGORIES;
}

export class AddCategory implements Action {
  readonly type = ADD_CATEGORY;

  constructor(public payload: CategoryModel) {}
}

export class UpdateCategory implements Action {
  readonly type = UPDATE_CATEGORY;

  constructor(public payload: { categoryId: number; newCategory: CategoryModel }) {}
}

export class DeleteCategory implements Action {
  readonly type = DELETE_CATEGORY;

  constructor(public payload: number) {}
}

export class isShowTrack implements Action {
  readonly type = SHOW_FASTTRACK;

  constructor(public payload: boolean) {}
}

export type CategoryActions =
  | SetCategories
  | FetchCategories
  | AddCategory
  | UpdateCategory
  | DeleteCategory
  | isShowTrack;