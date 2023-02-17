import { Component, OnInit, OnDestroy, ChangeDetectorRef, Input } from '@angular/core';
import { LoaderService } from '../../services/loader/loader.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-loader',
  templateUrl: './loader.component.html',
  styleUrls: ['./loader.component.scss'],
})
export class LoaderComponent implements OnInit, OnDestroy {
  public show: boolean = false;
  private subscription: Subscription;
  @Input() inlineStyle: boolean;

  constructor(
    private loaderService: LoaderService,
    private cdRef: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.subscription = this.loaderService.loaderState.subscribe(
      (state: any) => {
        this.show = state.show;
        this.cdRef.detectChanges();
      }
    );
  }

  ngOnDestroy() {
    if (this.subscription) {
      this.subscription.unsubscribe();
    }
  }
}
