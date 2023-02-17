import * as CompareActions from './comparison.actions';
import { UPDATE_APPLICATION } from '../application/application.actions';

export interface State {
  compareApplications: number[];
}

const initialState: State = {
  compareApplications: [],
};

export function comparisonReducer(
  state = initialState,
  action: CompareActions.CompareActions
) {
  switch (action.type) {
    case CompareActions.SET_COMPARE_APPLICATIONS:
      localStorage.setItem(
        'compareApplications',
        JSON.stringify([...action.payload])
      );
      return {
        ...state,
        compareApplications: [...action.payload],
      };
    case CompareActions.ADD_COMPARE_APPLICATION:
      const newCompareArray = [...state.compareApplications, action.payload];
      localStorage.setItem(
        'compareApplications',
        JSON.stringify(newCompareArray)
      );
      return {
        ...state,
        compareApplications: newCompareArray,
      };
    case CompareActions.DELETE_COMPARE_APPLICATION:
      const updatedCompare = state.compareApplications.filter(
        (application, index) => {
          return application !== action.payload;
        }
      );
      localStorage.setItem(
        'compareApplications',
        JSON.stringify(updatedCompare)
      );

      return {
        ...state,
        compareApplications: updatedCompare,
      };
    default:
      return state;
  }
}
