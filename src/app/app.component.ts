import { Component, OnInit } from '@angular/core';
import { BreakpointObserver, BreakpointState } from '@angular/cdk/layout';
import { Store } from '@ngrx/store';
import { AmplitudeService } from '@services';

import * as fromApp from '@store/app.reducer';
import * as SideMenuActions from '@store/side-menu/side-menu.actions';



@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent implements OnInit {

  constructor(
    public breakpointObserver: BreakpointObserver,
    private store: Store<fromApp.AppState>,
    private amplitudeService: AmplitudeService
    ) {}

  ngOnInit() {
    this.amplitudeService.initAmplitude();

    this.breakpointObserver
      .observe(['(max-width: 991px)'])
      .subscribe((state: BreakpointState) => {
        if (state.matches) {
          this.store.dispatch(new SideMenuActions.SetSidenavActive(true));
        } else {
          this.store.dispatch(new SideMenuActions.SetSidenavActive(false));
        }
      });
  }
}
