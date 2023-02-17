import {
  Directive,
  OnChanges,
  OnInit,
  ElementRef,
  Renderer2,
} from '@angular/core';
import { Store } from '@ngrx/store';
import * as fromApp from '../../../../store/app.reducer';
import { map } from 'rxjs/operators';
import { OnDestroy } from '@angular/core';
import { Subscription } from 'rxjs';
@Directive({
  selector: '[appGetCompareNumber]',
})
export class GetCompareNumberDirective implements OnInit, OnDestroy {
  private compareSubscription: Subscription;
  constructor(
    private el: ElementRef,
    private renderer: Renderer2,
    private store: Store<fromApp.AppState>
  ) {}

  ngOnInit() {
    this.compareSubscription = this.store
      .select('compareApplications')
      .pipe(map((compareState) => compareState.compareApplications.length))
      .subscribe((applicationLength: number) => {
        this.clearTextNodes();

        if (applicationLength !== 0) {
          const numberApplications = this.renderer.createText(
            applicationLength.toString()
          );
          this.renderer.appendChild(this.el.nativeElement, numberApplications);
        }
      });
  }

  ngOnDestroy() {
    if (this.compareSubscription) {
      this.compareSubscription.unsubscribe();
    }
  }

  private clearTextNodes() {
    this.el.nativeElement.childNodes.forEach((node) => {
      this.renderer.removeChild(this.el.nativeElement, node);
    });
  }
}
