import { AppRoles } from '../core/app.roles';

export interface ProfileModel {
  id: number;
  role: AppRoles;
  email: string;
  fullname: string;
  updatedAt: string;
  createdAt: string;
}