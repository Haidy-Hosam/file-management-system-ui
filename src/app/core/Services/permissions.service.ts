import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { PagePermission, Permission } from '../models/permission.model';

@Injectable({ providedIn: 'root' })
export class PermissionsService {
  private baseUrl = 'http://localhost:8080/api/permissions/Userpermissions';
  private baseUrl2 = `http://localhost:8080/api/permissions`;
  private map = signal<Map<string, Set<string>>>(new Map());
  loaded = signal(false);

  constructor(private http: HttpClient) {}

  load() {
    return this.http.get<PagePermission[]>(this.baseUrl).pipe(
      tap(list => {
        const m = new Map<string, Set<string>>();
        for (const pp of list) {
          m.set(pp.page.pageName.toUpperCase(),
                new Set(pp.permissions.map(p => p.permissionName.toUpperCase())));
        }
        this.map.set(m);
        this.loaded.set(true);
      })
    );
  }

  has(page: string, permission: string): boolean {
    return this.map().get(page.toUpperCase())?.has(permission.toUpperCase()) ?? false;
  }

  clear(): void {
    this.map.set(new Map());
    this.loaded.set(false);
  }

  getAllPermissions(): Observable<Permission[]> {
    return this.http.get<Permission[]>(this.baseUrl2);
  }
}