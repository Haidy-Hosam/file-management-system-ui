import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import {Page} from '../models/page.model'


@Injectable({ providedIn: 'root' })
export class PageService {
  private baseUrl = 'http://localhost:8080/api/user/pages';

  constructor(private http: HttpClient) {}

  getMyPages(): Observable<Page[]> {
    return this.http.get<Page[]>(this.baseUrl);
  }
}