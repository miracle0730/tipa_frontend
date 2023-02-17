import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { environment } from '../../../../environments/environment';
import { TokensResponse } from 'src/app/models/Auth';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private url: string = environment.url;
  constructor(private http: HttpClient) {}

  login(body) {
    return this.http.post(this.url + '/api/v1/user/signin', body);
  }

  signupStart(body: {email: string}) {
    return this.http.post(this.url + '/api/v1/user/signup', body);
  }

  signupFinish(body: {email: string; password: string}, token: string) {
    let params = new HttpParams();
    params = params.append('token', token);
    return this.http.post(this.url + '/api/v1/user/signup-finish', body, { params });
  }

  resetPasswordStart(body: {email: string}) {
    return this.http.post(this.url + '/api/v1/user/reset-password', body);
  }

  resetPasswordFinish(body: {email: string; password: string}, token: string) {
    let params = new HttpParams();
    params = params.append('token', token);
    return this.http.put(this.url + '/api/v1/user/reset-password-finish', body, { params });
  }

  setRedirectUrl(redirectUrl: string) {
    sessionStorage.setItem('redirectUrl', JSON.stringify(redirectUrl));
  }

  getRedirectUrl() {
    return JSON.parse(sessionStorage.getItem('redirectUrl'));
  }

  removeRedirectUrl() {
    sessionStorage.removeItem('redirectUrl');
  }

  /**
   * Stores tokens
   * @param token token response from signin response
   */
  public storeTokens(token: TokensResponse) {
    localStorage.setItem('token', token.accessToken);
    localStorage.setItem('expiredIn', token.expiresIn.toString());
  }

  /**
   * Removes tokens
   */
  public removeTokens() {
    localStorage.clear();
    sessionStorage.clear();
  }

  /**
   * Gets token
   * @returns authentication token
   */
  public getToken() {
    return localStorage.getItem('token') || '';
  }

  /**
   * Gets refresh token
   * @returns authentication refresh token
   */
  public getRefreshToken() {
    return localStorage.getItem('refreshToken') || '';
  }
}
