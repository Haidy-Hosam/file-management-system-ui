import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface PageResponse {
  name: string;
  route: string;
}

@Injectable({ providedIn: 'root' })
export class PageService {
  private baseUrl = 'http://localhost:8080/api/user/pages';

  constructor(private http: HttpClient) {}

  getMyPages(): Observable<PageResponse[]> {
    return this.http.get<PageResponse[]>(this.baseUrl);
  }
}