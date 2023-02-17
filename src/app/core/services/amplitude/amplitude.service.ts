import { Injectable } from '@angular/core';
import { environment } from '../../../../environments/environment';
import { Store } from '@ngrx/store';
import { ProfileModel } from 'src/app/models';
import { map } from 'rxjs/operators';

import * as fromApp from '../../../store/app.reducer';
import * as amplitude from 'amplitude-js';

@Injectable({
  providedIn: 'root',
})
export class AmplitudeService {
  private amplitudeKey = environment.amplitudeApi;

  constructor(private store: Store<fromApp.AppState>) {}

  initAmplitude() {
    amplitude.getInstance().init(this.amplitudeKey);
  }

  addNewEvent(eventName: string, eventParams) {
    this.store
      .select('profile')
      .pipe(map((profileStore) => profileStore.profile))
      .subscribe((res: ProfileModel) => {
        if (res) {
          amplitude.getInstance().setUserId(res.email);
          amplitude.getInstance().logEvent(eventName, eventParams);
        }
      });
  }
}
