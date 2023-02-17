import {RolesModel} from './Roles';

export interface UsersModel {
  id: number;
  role: number;
  email: string;
  fullname: string;
  last_sign_in: string;
  rolesInfo?: RolesModel;
}
