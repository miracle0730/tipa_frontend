import { Action } from '@ngrx/store';
export const LOGOUT = '[Auth] Logout';

export class LogoutAction implements Action {
  readonly type = LOGOUT;
}
