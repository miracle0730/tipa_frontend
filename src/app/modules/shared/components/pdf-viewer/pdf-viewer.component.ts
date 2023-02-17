import { Component, OnInit, Input } from '@angular/core';

@Component({
  selector: 'app-pdf-viewer',
  templateUrl: './pdf-viewer.component.html',
  styleUrls: ['./pdf-viewer.component.scss']
})
export class PdfViewerComponent implements OnInit {
  @Input() pdfSrc: string;

  public fullScreen: boolean = false;
  public openFile: boolean = false;
  public viewBookmark: false = false;

  constructor() { }

  ngOnInit(): void {
  }

}
