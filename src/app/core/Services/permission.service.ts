import { Injectable } from '@angular/core';
import { Page } from '../models/page.model';

@Injectable({ providedIn: 'root' })
export class PermissionService {
  private pages: Page[] = [];

  setPages(pages: Page[]) {
    this.pages = pages;
  }

  getPages() {
    return this.pages;
  }

  hasPage(pageName: string): boolean {
    return this.pages.some((page) => page.pageName === pageName);
  }
}
