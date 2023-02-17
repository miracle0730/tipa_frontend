import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { StageColorPickerComponent } from './stage-color-picker.component';

describe('StageColorPickerComponent', () => {
  let component: StageColorPickerComponent;
  let fixture: ComponentFixture<StageColorPickerComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ StageColorPickerComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(StageColorPickerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
