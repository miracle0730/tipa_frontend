import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';

// Models
import { HeaderFilterModel } from '@models';

@Injectable({
  providedIn: 'root',
})
export class HeaderService {
  private keyHeaderFilter: string = 'headerFilter';

  constructor(private http: HttpClient) {}

  setHeaderFilter(headerFilter: HeaderFilterModel) {
    localStorage.setItem(this.keyHeaderFilter, JSON.stringify(headerFilter));
  }

  getHeaderFilter(): HeaderFilterModel {
    return JSON.parse(localStorage.getItem(this.keyHeaderFilter));
  }
}
