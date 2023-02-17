import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { FormControl } from "@angular/forms";

@Component({
  selector: 'app-text-editor',
  templateUrl: './text-editor.component.html',
  styleUrls: ['./text-editor.component.scss']
})
export class TextEditorComponent implements OnInit {
  @Input() control: FormControl;
  @Input() placeholder: string;

  @Output() changeControl: EventEmitter<any> = new EventEmitter();

  quillConfig = {
    toolbar: {
      container: [
        ["bold", "italic", "underline", "strike", { list: "ordered" }, { list: "bullet" }, "link"], // toggled buttons
        // [{ list: "ordered" }, { list: "bullet" }],
        // [{ size: ["small", false, "large", "huge"] }], // custom dropdown
        // [{ header: [1, 2, 3, 4, 5, 6, false] }],
      ]
    }
  };

  constructor() {}

  ngOnInit(): void {
    this.control = this.control || new FormControl();
    this.placeholder = this.placeholder || 'Enter ...';
  }

  onControlChanged(event) {
    this.changeControl.emit(this.control);
  };
}
