import { Action } from '@ngrx/store';
import { ThicknessModel } from '@models';

export const SET_THICKNESS = '[Thickness] Set Thickness';
export const FETCH_THICKNESS = '[Thickness] Fetch Thickness';
export const ADD_THICKNESS = '[Thickness] Add Thickness';
export const UPDATE_THICKNESS = '[Thickness] Update Thickness';
export const DELETE_THICKNESS = '[Thickness] Delete Thickness';

export class SetThickness implements Action {
  readonly type = SET_THICKNESS;

  constructor(public payload: ThicknessModel[]) {}
}

export class FetchThickness implements Action {
  readonly type = FETCH_THICKNESS;
}

export class AddThickness implements Action {
  readonly type = ADD_THICKNESS;

  constructor(public payload: ThicknessModel) {}
}

export class UpdateThickness implements Action {
  readonly type = UPDATE_THICKNESS;

  constructor(public payload: ThicknessModel) {}
}

export class DeleteThickness implements Action {
  readonly type = DELETE_THICKNESS;

  constructor(public payload: number) {}
}

export type ThicknessActions =
  | SetThickness
  | FetchThickness
  | AddThickness
  | UpdateThickness
  | DeleteThickness;
