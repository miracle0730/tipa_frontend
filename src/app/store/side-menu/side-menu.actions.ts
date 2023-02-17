import { Action } from '@ngrx/store';

export const GET_SIDENAV_OPEN = '[Sidenav] Get Sidenav is open';
export const SET_SIDENAV_OPEN = '[Sidenav] Set Sidenav open';

export class GetSidenav implements Action {
  readonly type = GET_SIDENAV_OPEN;
}

export class SetSidenavActive implements Action {
  readonly type = SET_SIDENAV_OPEN;

  constructor(public payload: boolean) {}
}

export type SideMenuActions = GetSidenav | SetSidenavActive;
