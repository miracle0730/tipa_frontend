import * as ThicknessActions from './thickness.actions';
import { ThicknessModel } from '@models';

export interface State {
  thickness: ThicknessModel[];
};

const initialState: State = {
  thickness: []
};

export function thicknessReducer(
  state = initialState,
  action: ThicknessActions.ThicknessActions
) {
  switch (action.type) {
    case ThicknessActions.SET_THICKNESS:
      return {
        ...state,
        thickness: [...action.payload],
      };
    case ThicknessActions.ADD_THICKNESS:
      return {
        ...state,
        thickness: [...state.thickness, action.payload],
      };
    case ThicknessActions.UPDATE_THICKNESS:
      const copyAllThickness = [...state.thickness];
      const copyNewThickness = {...action.payload};

      const indexCategory = copyAllThickness.findIndex(
        (item) => item.id === copyNewThickness.id
      );

      copyAllThickness[indexCategory] = copyNewThickness;

      return {
        ...state,
        thickness: copyAllThickness,
      };
    case ThicknessActions.DELETE_THICKNESS:
      return {
        ...state,
        thickness: state.thickness.filter((thickness, index) => {
          return thickness.id !== action.payload;
        }),
      };
    default:
      return state;
  }
}
