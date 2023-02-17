import * as ProfileActions from './profile.actions';
import { ProfileModel } from 'src/app/models';

export interface State {
  profile: ProfileModel;
  profileLoaded: boolean;
}

const initialState: State = {
  profile: null,
  profileLoaded: false,
};

export function profileReducer(
  state = initialState,
  action: ProfileActions.ProfileActions
) {
  switch (action.type) {
    case ProfileActions.SET_PROFILE:
      return {
        ...state,
        profile: { ...action.payload },
        profileLoaded: true,
      };
    case ProfileActions.UPDATE_PROFILE:
      return {
        ...state,
        profile: { ...action.payload.newProfile },
      };
    default:
      return state;
  }
}
