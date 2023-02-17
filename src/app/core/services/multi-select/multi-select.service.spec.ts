/* tslint:disable:no-unused-variable */

import { TestBed, async, inject } from '@angular/core/testing';
import { MultiSelectService } from './multi-select.service';

describe('Service: MultiSelect', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [MultiSelectService]
    });
  });

  it('should ...', inject([MultiSelectService], (service: MultiSelectService) => {
    expect(service).toBeTruthy();
  }));
});
