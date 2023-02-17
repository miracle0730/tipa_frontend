import {Injectable} from '@angular/core';
import {environment} from '../../../../environments/environment';
import {HttpClient} from '@angular/common/http';
import {UsersModel} from '@models';

@Injectable({
  providedIn: 'root'
})
export class UsersService {
  private url = environment.url;

  constructor(private http: HttpClient) {
  }

  getUsers() {
    return this.http.get<UsersModel[]>(`${this.url}/api/v1/users`);
  }

  changeRole(id: number, role: number){
      return this.http.post<any>(`${this.url}/api/v1/user/${id}/role/${role}`, {});
  }

  delete(id: number){
      return this.http.delete<any>(`${this.url}/api/v1/user/${id}`);
  }
}
