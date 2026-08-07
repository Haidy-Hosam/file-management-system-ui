

import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { Page } from '../models/page.model';

interface PageApiResponse {
  pageId: number;
  pageName: string;
  route: string;
}

@Injectable({ providedIn: 'root' })
export class PageService {
 private baseUrl = 'http://localhost:8080/api/user/pages';

  constructor(private http: HttpClient) {}

  // getAllPages(): Observable<Page[]> {
  //   return this.http.get<PageApiResponse[]>(this.baseUrl).pipe(
  //     map(pages => pages.map(this.toPage))
  //   );
  // }

  getMyPages(): Observable<Page[]> {
    return this.http.get<PageApiResponse[]>(`http://localhost:8080/api/user/pages`).pipe(
      map(pages => pages.map(this.toPage))
    );
  }

  private toPage(p: PageApiResponse): Page {
    return { id: p.pageId, name: p.pageName, route: p.route };
  }
}