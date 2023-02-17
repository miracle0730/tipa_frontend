import { Action } from '@ngrx/store';
import { ProfileModel } from 'src/app/models';

export const SET_PROFILE = '[Profile] Set Profile';
export const FETCH_PROFILE = '[Profile] Fetch Profile';
export const UPDATE_PROFILE = '[Profile] Update Profile';
export const ERROR_PROFILE = '[Profile] Error Profile';

export class SetProfile implements Action {
  readonly type = SET_PROFILE;

  constructor(public payload: ProfileModel) {}
}

export class FetchProfile implements Action {
  readonly type = FETCH_PROFILE;
}

export class UpdateProfile implements Action {
  readonly type = UPDATE_PROFILE;

  constructor(public payload: { newProfile: ProfileModel }) {}
}

export class ErrorProfile implements Action {
  readonly type = ERROR_PROFILE;

  constructor(public payload: any) {}
}

export type ProfileActions =
  | SetProfile
  | UpdateProfile
  | FetchProfile
  | ErrorProfile;
