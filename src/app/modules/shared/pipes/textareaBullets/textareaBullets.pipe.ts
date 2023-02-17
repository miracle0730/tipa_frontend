import { Pipe, PipeTransform, Renderer2 } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';

@Pipe({
  name: 'textareaBullets',
})
export class TextareaBulletsPipe implements PipeTransform {
  constructor(private renderer: Renderer2, private sanitizer: DomSanitizer) {}

  transform(value: any, args?: any): any {
    const splittedElements = value.split(/\n/gi);
    const divTag = this.renderer.createElement('div');

    const listEl = this.renderer.createElement('ul');
    this.renderer.addClass(listEl, 'col-12');

    splittedElements.forEach((text, index) => {
      const liEl = this.renderer.createElement('li');
      const liText = this.renderer.createText(text);
      this.renderer.appendChild(liEl, liText);
      this.renderer.appendChild(listEl, liEl);
    });

    this.renderer.appendChild(divTag, listEl);

    return this.sanitizer.bypassSecurityTrustHtml(divTag.outerHTML);
  }
}
