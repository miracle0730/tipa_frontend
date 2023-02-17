import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { environment } from '../../../../environments/environment';
import { ThicknessModel } from '@models';

@Injectable({
  providedIn: 'root'
})
export class ThicknessService {
  private url = environment.url;

  constructor(private http: HttpClient) {}

  /**
   * Gets thickness
   * @returns thickness
   */
  getThickness() {
    return this.http.get<ThicknessModel[]>(`${this.url}/api/v1/thickness`);
  }

  /**
   * Adds thickness
   * @param body body for creating thickness
   * @returns thickness
   */
  addThickness(body: {value: number}) {
    return this.http.post(`${this.url}/api/v1/thickness`, body);
  }

  /**
   * Edits thickness
   * @param thicknessId id for updated thickness
   * @param body body for updating thickness
   * @returns thickness
   */
  editThickness(thicknessId: number, body: {value: number}) {
    return this.http.put(`${this.url}/api/v1/thickness/${thicknessId}`, body);
  }

  /**
   * Deletes thickness
   * @param thicknessId id of thickness
   * @returns text
   */
  deleteThickness(thicknessId: number) {
    const headers = new HttpHeaders().set(
      'Content-Type',
      'text/plain; charset=utf-8'
    );
    return this.http.delete(`${this.url}/api/v1/thickness/${thicknessId}`, {headers, responseType: 'text'});
  }
}
