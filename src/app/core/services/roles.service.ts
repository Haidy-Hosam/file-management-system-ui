import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Permission {
  id: number;
  name: string;
}

export interface RoleUser {
  id: number;
  name?: string;
  username?: string;
  email?: string;
}

export interface Role {
  id: number;
  name: string;
  users: RoleUser[];
  permissions: Permission[];
}

export interface RoleRequest {
  name: string;
  permissionIds?: number[];
}

@Injectable({ providedIn: 'root' })
export class RolesService {
  private baseUrl = 'http://localhost:8080/api/roles';

  constructor(private http: HttpClient) {}

  getAllRoles(): Observable<Role[]> {
    return this.http.get<Role[]>(this.baseUrl);
  }

  getRoleById(roleId: number): Observable<Role> {
    return this.http.get<Role>(`${this.baseUrl}/${roleId}`);
  }

  createRole(request: RoleRequest): Observable<Role> {
    return this.http.post<Role>(this.baseUrl, request);
  }

  updateRole(roleId: number, request: RoleRequest): Observable<Role> {
    return this.http.put<Role>(`${this.baseUrl}/${roleId}`, request);
  }

  deleteRole(roleId: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${roleId}`);
  }
}