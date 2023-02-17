import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { environment } from '../../../../environments/environment';
import { ApplicationInfoPageQueryParamsKeysModel, ApplicationModel, CategoryModel, GetApplicationsParamsModel } from 'src/app/models';

// Libs
import * as _ from 'lodash';
import { Subject } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class ApplicationService {
  public searchEvent = new Subject();
  public filterEvent = new Subject();

  private url = environment.url;
  private applicationInfoPageQueryParamsKeys: ApplicationInfoPageQueryParamsKeysModel = {
    tabIndex: 'tabIndex',
  };

  constructor(private http: HttpClient) {}

  /**
   * Get queryParams keys for application-info page
   */
  getApplicationInfoPageQueryParamsKeys(): ApplicationInfoPageQueryParamsKeysModel {
    return _.cloneDeep(this.applicationInfoPageQueryParamsKeys);
  }

  /**
   * Gets applications
   */
  getApplications(dataParams?: GetApplicationsParamsModel) {
    // let params = new HttpParams();
    // if (categories.parentCategory) {
    //   const queryParamName =
    //     categories.parentCategory.title === 'Segments'
    //       ? 'segment'
    //       : 'application';

    //   if (categories.currentCategory.parent_id) {
    //     params = params.append(
    //       queryParamName,
    //       categories.currentCategory.id.toString()
    //     );
    //   }
    // }

    let params = new HttpParams();
    
    if (dataParams) {
      // ONLY for RFQ form, for associated applications -> associated = true
      // GET applications and associated applications
      if (dataParams.hasOwnProperty('associated')) {
        params = params.append('associated', `${dataParams.associated}`);
      }
      if (dataParams.hasOwnProperty('rfq_page')) {
        params = params.append('rfq_page', `${dataParams.rfq_page}`);
      }
    }

    return this.http.get<ApplicationModel[]>(this.url + '/api/v1/application', {params});
  }

  /**
   * Gets application by id
   * @param applicationId application Id
   * @returns application information
   */
  getApplicationById(applicationId: number) {
    return this.http.get(`${this.url}/api/v1/application/${applicationId}`);
  }

  /**
   * Adds application
   * @param body application info body
   * @returns new application response
   */
  addApplication(body) {
    return this.http.post(this.url + '/api/v1/application', body);
  }

  /**
   * Updates application
   * @param applicationId application id
   * @param body updated application information
   * @returns updated response for application
   */
  updateApplication(applicationId: number, body) {
    return this.http.put(`${this.url}/api/v1/application/${applicationId}`, body);
  }

  /**
   * Deletes application
   * @param applicationId application id
   * @returns text response if application is deleted
   */
  deleteApplication(applicationId: number) {
    const headers = new HttpHeaders().set(
      'Content-Type',
      'text/plain; charset=utf-8'
    );
    return this.http.delete(`${this.url}/api/v1/application/${applicationId}`, {
      headers,
      responseType: 'text',
    });
  }

  /**
   * Check application number available
   * @param appId application id
   * @param appNumber new application number
   * @returns text response, Is the appNumber available?
   */
  checkApplicationNumberAvailable(appId: number, appNumber: string) {
    let body = {
      application_id: appId,
      application_number: String(appNumber),
    };
    return this.http.post(`${this.url}/api/v1/application/check-number`, body);
  }

  /**
   * Searchs by key
   * @param key query string
   * @returns products and materials by keyword
   */
  searchByKey(key: string) {
    const params = new HttpParams().append('query', key);
    return this.http.get(`${this.url}/api/v1/search`, { params });
  }
}
