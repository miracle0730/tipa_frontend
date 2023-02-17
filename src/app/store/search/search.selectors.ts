import { createFeatureSelector, createSelector } from '@ngrx/store';
import { SEARCH_FEATURE_KEY, SearchState } from './search.reducer';

export const selectFeature = createFeatureSelector<SearchState>(SEARCH_FEATURE_KEY);
export const selectSearch = createSelector(selectFeature, state => state.search);
