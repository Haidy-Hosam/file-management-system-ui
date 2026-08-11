import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { SecurityLevel } from '../models/SecurityLevel.model';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class SecuritylevelService {
  private baseUrl = 'http://localhost:8080/api/securitylevel/securityLevel';

  constructor(private http: HttpClient) {}

  // GET /api/securitylevel/securityLevel
  getSecurityLevels(): Observable<SecurityLevel[]> {
    return this.http.get<SecurityLevel[]>(`${this.baseUrl}`);
  }

  // POST /api/securitylevel/securityLevel/{name}
  createSecurityLevel(name: string): Observable<SecurityLevel> {
    return this.http.post<SecurityLevel>(`${this.baseUrl}/${encodeURIComponent(name)}`, null);
  }

  // PUT /api/securitylevel/securityLevel  — body: { Id, name }
  updateSecurityLevel(Id: number, name: string): Observable<SecurityLevel> {
    return this.http.put<SecurityLevel>(`${this.baseUrl}`, { Id, name });
  }

  // DELETE /api/securitylevel/securityLevel/{id}
  deleteSecurityLevel(id: number): Observable<SecurityLevel> {
    return this.http.delete<SecurityLevel>(`${this.baseUrl}/${id}`);
  }
}
