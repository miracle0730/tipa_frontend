import * as SideMenuActions from './side-menu.actions';

export interface State {
  sideMenuHidden: boolean;
}

const initialState: State = {
  sideMenuHidden: false,
};

export function sideMenuReducer(
  state = initialState,
  action: SideMenuActions.SideMenuActions
) {
  switch (action.type) {
    case SideMenuActions.SET_SIDENAV_OPEN:
      return {
        ...state,
        sideMenuHidden: action.payload,
      };
    default:
      return state;
  }
}
