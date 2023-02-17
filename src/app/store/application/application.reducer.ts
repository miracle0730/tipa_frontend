import * as ApplicationActions from './application.actions';
import { ApplicationModel } from 'src/app/models';
import * as _ from 'lodash';

export interface State {
  applications: ApplicationModel[];
  applicationInfo: ApplicationModel;
  allApplicationsLoaded: boolean;
  error: any;
  keepScrollY: number;
}

const initialState: State = {
  applications: [],
  applicationInfo: null,
  allApplicationsLoaded: false,
  error: null,
  keepScrollY: 0,
};

export function applicationReducer(
  state = initialState,
  action: ApplicationActions.ApplicationActions
) {
  switch (action.type) {
    case ApplicationActions.SET_APPLICATIONS:
      return {
        ...state,
        applications: getSortedApplications([...action.payload]),
        allApplicationsLoaded: true,
        error: null,
      };
    case ApplicationActions.SET_APPLICATION:
      return {
        ...state,
        applicationInfo: { ...action.payload },
      };
    case ApplicationActions.ADD_APPLICATION:
      return {
        ...state,
        applications: getSortedApplications([...state.applications, action.payload]),
      };
    case ApplicationActions.UPDATE_APPLICATION:
      const copyApplications = [...state.applications];
      const copyNewProduct = { ...action.payload.newApplication };

      const indexProduct = copyApplications.findIndex(
        (item) => item.id === action.payload.applicationId
      );

      copyApplications[indexProduct] = copyNewProduct;

      return {
        ...state,
        applications: getSortedApplications([...copyApplications]),
        applicationInfo: copyNewProduct,
      };
    case ApplicationActions.DELETE_APPLICATION:
      return {
        ...state,
        applications: state.applications.filter((application, index) => {
          return application.id !== action.payload;
        }),
        applicationInfo: null,
      };
    case ApplicationActions.FETCH_APPLICATION:
      return {
        ...state,
        applicationInfo: null,
      };
    case ApplicationActions.ERROR_APPLICATION:
      return {
        ...state,
        error: { ...action.payload },
        allApplicationsLoaded: false,
      };
    case ApplicationActions.KEEP_SCROLL_Y_APPLICATION:
      return {
        ...state,
        keepScrollY: action.payload,
      };
    default:
      return state;
  }
}

function getSortedApplications(applications: ApplicationModel[]): ApplicationModel[] {
  let sortedApplications = _.orderBy(applications, ['display_priority'], ['asc']);
  
  return JSON.parse(JSON.stringify([...sortedApplications]));
}
