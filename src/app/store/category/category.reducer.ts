import * as CategoryActions from './category.actions';
import { CategoryModel } from '../../models/Category';

export interface State {
  categories: CategoryModel[];
  isShowFastTrack: boolean;
}

const initialState: State = {
  categories: [],
  isShowFastTrack: true,
};

export function categoryReducer(
  state = initialState,
  action: CategoryActions.CategoryActions
) {
  switch (action.type) {
    case CategoryActions.SET_CATEGORIES:
      return {
        ...state,
        categories: [...action.payload],
      };
    case CategoryActions.ADD_CATEGORY:
      return {
        ...state,
        categories: [...state.categories, action.payload],
      };
    case CategoryActions.UPDATE_CATEGORY:
      const copyAllCategories = [...state.categories];
      const copyNewCategory = { ...action.payload.newCategory };

      const indexCategory = copyAllCategories.findIndex(
        (item) => item.id === action.payload.categoryId
      );

      copyAllCategories[indexCategory] = copyNewCategory;

      return {
        ...state,
        categories: copyAllCategories,
      };
    case CategoryActions.DELETE_CATEGORY:
      return {
        ...state,
        categories: state.categories.filter((category, index) => {
          return category.id !== action.payload;
        }),
      };
    case CategoryActions.SHOW_FASTTRACK:
      return {
        ...state,
        isShowFastTrack: action.payload
      };
    default:
      return state;
  }
}
