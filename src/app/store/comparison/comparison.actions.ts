import { Action } from '@ngrx/store';

export const FETCH_COMPARE_APPLICATIONS =
  '[Compare] Fetch Compare Applications';
export const SET_COMPARE_APPLICATIONS = '[Compare] Set Compare Applications';
export const ADD_COMPARE_APPLICATION = '[Compare] Add Compare Aplication';
export const DELETE_COMPARE_APPLICATION =
  '[Compare] Delete Compare Application';

export class FetchCompareApplications implements Action {
  readonly type = FETCH_COMPARE_APPLICATIONS;
}

export class SetCompareApplications implements Action {
  readonly type = SET_COMPARE_APPLICATIONS;

  constructor(public payload: number[]) {}
}
export class AddCompareApplication implements Action {
  readonly type = ADD_COMPARE_APPLICATION;

  constructor(public payload: number) {}
}
export class DeleteCompareApplication implements Action {
  readonly type = DELETE_COMPARE_APPLICATION;

  constructor(public payload: number) {}
}

export type CompareActions =
  | FetchCompareApplications
  | SetCompareApplications
  | AddCompareApplication
  | DeleteCompareApplication;
