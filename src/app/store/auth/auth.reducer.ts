import * as AuthActions from './auth.actions';

export function clearState(reducer) {
  return (state, action) => {
    if (action.type === AuthActions.LOGOUT) {
      state = undefined;
    }

    return reducer(state, action);
  };
}
