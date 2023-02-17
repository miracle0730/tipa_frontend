import { ActionReducerMap } from '@ngrx/store';

import * as fromCategory from './category/category.reducer';
import * as fromThickness from './thickness/thickness.reducer';
import * as fromApplication from './application/application.reducer';
import * as fromProduct from './product/product.reducer';
import * as fromProfile from './profile/profile.reducer';
import * as fromSideMenu from './side-menu/side-menu.reducer';
import * as fromCompare from './comparison/comparison.reducer';
import * as fromSearch from './search/search.reducer';

export interface AppState {
  categories: fromCategory.State;
  thickness: fromThickness.State;
  applications: fromApplication.State;
  products: fromProduct.State;
  profile: fromProfile.State;
  sideMenuHidden: fromSideMenu.State;
  compareApplications: fromCompare.State;
  [fromSearch.SEARCH_FEATURE_KEY]: fromSearch.SearchState;
}

export const appReducer: ActionReducerMap<AppState> = {
  categories: fromCategory.categoryReducer,
  thickness: fromThickness.thicknessReducer,
  applications: fromApplication.applicationReducer,
  products: fromProduct.productReducer,
  profile: fromProfile.profileReducer,
  sideMenuHidden: fromSideMenu.sideMenuReducer,
  compareApplications: fromCompare.comparisonReducer,
  [fromSearch.SEARCH_FEATURE_KEY]: fromSearch.SearchReducer,
};
