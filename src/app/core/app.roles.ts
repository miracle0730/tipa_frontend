import {RolesModel} from '@models';

export enum AppRoles {
  Administrator = 1,
  Sales = 2,
  Commercial = 3
}

export const RolesList: RolesModel[] = [
  {
    id: AppRoles.Administrator,
    title: 'Administrator'
  },
  {
    id: AppRoles.Sales,
    title: 'Full Funnel Viewer'
  },
  {
    id: AppRoles.Commercial,
    title: 'Commercial viewer'
  }
];
