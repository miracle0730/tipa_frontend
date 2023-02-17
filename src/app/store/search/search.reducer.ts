import { createReducer, on } from '@ngrx/store';
import * as SearchActions from './search.actions';

export const SEARCH_FEATURE_KEY = 'search';

export interface SearchAction {
  payload: string;
  type?: string;
}

export interface SearchState {
  search: string;
};

const initialState: SearchState = {
  search: ''
};

export const SearchReducer = createReducer(
  initialState,
  on(SearchActions.setSearch, (state, action: SearchAction) => ({
      ...state,
      search: (action.payload && typeof action.payload === 'string') ? action.payload : ''
  })),
);
