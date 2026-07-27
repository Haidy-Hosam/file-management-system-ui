import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { User } from '../models/user.model';
import { HttpParams } from '@angular/common/http';
export interface UserResponse {
  u_id: number;
  name: string;
  email: string;
  role: string;
  departmentName: string;
  isDeleted: boolean;
  filesCount?: number;
  lastLogin?: string;
}

export interface RegisterRequest {
  name: string;
  username: string;
  email: string;
  password: string;
  roleId: number;
  departmentId: number;
}

export interface UpdateUserRequest {
  name: string;
  username: string;
  email: string;
  roleId: number;
  departmentId: number;
  isDeleted?: boolean;
}

@Injectable({ providedIn: 'root' })
export class UserService {
  private baseUrl = 'http://localhost:8080/api/user';

  constructor(private http: HttpClient) {}

  getAllUsers(): Observable<UserResponse[]> {
    return this.http.get<UserResponse[]>(this.baseUrl);
  }
  
  searchUsers(search?: string, roleId?: number): Observable<UserResponse[]> {
  let params = new HttpParams();
  if (search) {
    params = params.set('search', search);
  }
  if (roleId != null) {
    params = params.set('roleId', roleId.toString());
  }
  return this.http.get<UserResponse[]>(`${this.baseUrl}/search`, { params });
}

  getCurrentUser(): Observable<User> {
    return this.http.get<User>(`${this.baseUrl}/userRole`);
  }
  getUserById(id: number): Observable<UserResponse> {
  return this.http.get<UserResponse>(`${this.baseUrl}/${id}`);
}
  createUser(request: RegisterRequest): Observable<UserResponse> {
    return this.http.post<UserResponse>(this.baseUrl, request);
  }

  deleteUser(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }
 getMyProfile(): Observable<UserResponse> {
  return this.http.get<UserResponse>(`${this.baseUrl}/profile`);
}
updateUser(id: number, request: UpdateUserRequest): Observable<UserResponse> {
  return this.http.put<UserResponse>(`${this.baseUrl}/${id}`, request);
}

toggleStatus(id: number): Observable<UserResponse> {
  return this.http.patch<UserResponse>(`${this.baseUrl}/${id}/status`, {});
}
}