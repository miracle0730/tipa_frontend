import {
  Directive,
  ElementRef,
  Input,
  OnChanges,
  Renderer2,
} from '@angular/core';

@Directive({
  selector: '[appDisableSelect]',
})
export class DisableSelectDirective implements OnChanges {
  @Input() data: any[];
  constructor(private el: ElementRef, private renderer: Renderer2) {}

  ngOnChanges() {
    if (this.data.length === 0) {
      this.renderer.addClass(this.el.nativeElement, 'disabled');
    } else {
      this.renderer.removeClass(this.el.nativeElement, 'disabled');
    }
  }
}
