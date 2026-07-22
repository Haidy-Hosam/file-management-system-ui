import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface UserResponse {
  id: number;
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
  email: string;
  password: string;
  roleId: number;
  departmentId: number;
}

@Injectable({ providedIn: 'root' })
export class UserService {
  private baseUrl = 'http://localhost:8080/api/user';

  constructor(private http: HttpClient) {}

  getAllUsers(): Observable<UserResponse[]> {
    return this.http.get<UserResponse[]>(this.baseUrl);
  }

  getCurrentUser(): Observable<UserResponse> {
    return this.http.get<UserResponse>(`${this.baseUrl}/me`);
  }

  createUser(request: RegisterRequest): Observable<UserResponse> {
    return this.http.post<UserResponse>(this.baseUrl, request);
  }

  updateUser(id: number, request: RegisterRequest): Observable<UserResponse> {
    return this.http.put<UserResponse>(`${this.baseUrl}/${id}`, request);
  }

  deleteUser(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }
}