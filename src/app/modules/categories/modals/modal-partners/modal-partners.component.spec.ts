import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ModalPartnersComponent } from './modal-partners.component';

describe('ModalPartnersComponent', () => {
  let component: ModalPartnersComponent;
  let fixture: ComponentFixture<ModalPartnersComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ModalPartnersComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ModalPartnersComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
