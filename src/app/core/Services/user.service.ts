import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Page } from '../models/page.model';
import { User } from '../models/user.model';

@Injectable({ providedIn: 'root' })
export class UserService {
  private apiUrl = 'http://localhost:8080/api/v1/user';

  constructor(private http: HttpClient) {}

  getpages(): Observable<Page[]> {
    return this.http.get<Page[]>(`${this.apiUrl}/pages`);
  }

  getCurrentUser() {
    return this.http.get<User>('/api/users/me');
  }
}
