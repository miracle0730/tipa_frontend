import { Action } from '@ngrx/store';
import { ApplicationModel, CategoryModel } from 'src/app/models';

export const FETCH_APPLICATIONS = '[Applications] Fetch Applications';
export const FETCH_APPLICATION = '[Applications] Fetch Application';
export const SET_APPLICATIONS = '[Applications] Set Applications';
export const SET_APPLICATION = '[Applications] Set Application';
export const ADD_APPLICATION = '[Applications] Add Application';
export const UPDATE_APPLICATION = '[Applications] Update Application';
export const DELETE_APPLICATION = '[Applications] Delete Application';
export const ERROR_APPLICATION = '[Applications] Error Application';
export const KEEP_SCROLL_Y_APPLICATION = '[Applications] Keep Scroll Y Application';

export class FetchApplications implements Action {
  readonly type = FETCH_APPLICATIONS;

  constructor(public payload: boolean) {}
}

export class FetchApplication implements Action {
  readonly type = FETCH_APPLICATION;

  constructor(public payload: number) {}
}

export class SetApplications implements Action {
  readonly type = SET_APPLICATIONS;

  constructor(public payload: ApplicationModel[]) {}
}

export class SetApplication implements Action {
  readonly type = SET_APPLICATION;

  constructor(public payload: ApplicationModel) {}
}

export class AddApplication implements Action {
  readonly type = ADD_APPLICATION;

  constructor(public payload: ApplicationModel) {}
}

export class UpdateApplication implements Action {
  readonly type = UPDATE_APPLICATION;

  constructor(
    public payload: { applicationId: number; newApplication: ApplicationModel }
  ) {}
}

export class DeleteApplication implements Action {
  readonly type = DELETE_APPLICATION;

  constructor(public payload: number) {}
}

export class ErrorApplication implements Action {
  readonly type = ERROR_APPLICATION;

  constructor(public payload: any) {}
}

export class KeepScrollYApplication implements Action {
  readonly type = KEEP_SCROLL_Y_APPLICATION;

  constructor(public payload: number) {}
}

export type ApplicationActions =
  | FetchApplications
  | FetchApplication
  | SetApplications
  | SetApplication
  | AddApplication
  | UpdateApplication
  | DeleteApplication
  | ErrorApplication
  | KeepScrollYApplication;
