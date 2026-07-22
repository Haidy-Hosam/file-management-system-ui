import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { jwtDecode } from 'jwt-decode';
import { authResponse, LoginRequest ,DecodedToken} from '../models/auth.model';



@Injectable({ providedIn: 'root' })
export class AuthService {
  private baseUrl = 'http://localhost:8080/api/auth';

  constructor(private http: HttpClient) {}

  login(email: string, password: string,  rememberMe: boolean): Observable<authResponse> {
    const body: LoginRequest = { email, password, rememberMe };
    return this.http.post<authResponse>(`${this.baseUrl}/login`, body).pipe(
      tap(res => {
        if (rememberMe) {
          localStorage.setItem('accessToken', res.accessToken);
          localStorage.setItem('refreshToken', res.refreshToken);
        } else {
          sessionStorage.setItem('accessToken', res.accessToken);
          sessionStorage.setItem('refreshToken', res.refreshToken);
}
      })
    );
  }

  logout(): void {
     localStorage.removeItem('accessToken');
  localStorage.removeItem('refreshToken');
  sessionStorage.removeItem('accessToken');
  sessionStorage.removeItem('refreshToken');
  }

  getToken(): string | null {
  return localStorage.getItem('accessToken') ?? sessionStorage.getItem('accessToken');
  }

  getRefreshToken(): string | null {
  return localStorage.getItem('refreshToken') ?? sessionStorage.getItem('refreshToken');
  }

  isLoggedIn(): boolean {
    const token = this.getToken();
    if (!token) return false;

    const decoded = this.getDecodedToken();
    if (!decoded) return false;

    // exp is in seconds, Date.now() is in ms
    const isExpired = decoded.exp * 1000 < Date.now();
    return !isExpired;
  }

  getDecodedToken(): DecodedToken | null {
    const token = this.getToken();
    if (!token) return null;
    try {
      return jwtDecode<DecodedToken>(token);
    } catch {
      return null;
    }
  }

  getRole(): string | null {
    return this.getDecodedToken()?.role ?? null;
  }

  getUserId(): number | null {
    return this.getDecodedToken()?.userId ?? null;
  }

  getDeptId(): number | null {
    return this.getDecodedToken()?.deptId ?? null;
  }
}