import { createAction, props } from '@ngrx/store';

export const setSearch = createAction(
  '[Search Global] Set Search',
  props<{payload: string}>()
);
