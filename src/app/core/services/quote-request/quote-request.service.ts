import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';

// Env
import { environment } from '../../../../environments/environment';

// Interfaces
import { FtItemsModel, RfqModel } from '@models';

// Libs
import * as _ from 'lodash';

@Injectable({
  providedIn: 'root',
})
export class QuoteRequestService {
  private url = environment.url;

  // general data for RFQ form (Fast Track | Custom)
  private shippingTermsList: string[] = ['EXW', 'DAP'];
  private rfqIsFor = {
    commercialOrder: 'Commercial Order',
    customerTrial: 'Customer Trial',
  };

  constructor(private http: HttpClient) {}

  isOpenedWithinFrame(): boolean {
    let isWithinFrame = false;
    if (window && window.location !== window.parent.location) {
      isWithinFrame = true;
    }
    return isWithinFrame;
  }

  getOpportunity(opportunityId: string) {
    return this.http.get(`${this.url}/api/v1/zoho/opportunity/${opportunityId}`);
  }

  getRfq(rfq_id: string) {
    return this.http.get(`${this.url}/api/v1/zoho/rfq/${rfq_id}`);
  }

  createRfq(data: RfqModel, canBePriced: boolean) {
    let params = new HttpParams().append('can_be_priced', `${canBePriced}`);
    return this.http.post(`${this.url}/api/v1/zoho/rfq`, data, {params});
  }

  calculateRfq(data: RfqModel, calculateMoq: boolean = false) {
    let params = new HttpParams().append('calculate_moq', `${calculateMoq}`); 
    return this.http.post(`${this.url}/api/v1/zoho/rfq/price-estimation`, data, {params});
  }

  calculateFtRfqPriceList(ftItem: FtItemsModel) {
    return this.http.post(`${this.url}/api/v1/zoho/rfq/price-list`, ftItem);
  }

  /******************
    GET GENERAL DATA
  ******************/
 
  getShippingTermsList(): string[] {
    return _.cloneDeep(this.shippingTermsList);
  }

  getRfqIsFor() {
    return _.cloneDeep(this.rfqIsFor);
  }
}
