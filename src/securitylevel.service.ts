import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { SecurityLevel } from '../models/SecurityLevel.model';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class SecuritylevelService {
private baseUrl = 'http://localhost:8080/api/files/securityLevel';
  
 constructor(private http: HttpClient) {}

   getSecurityLevels(): Observable<SecurityLevel[]> {
     return this.http.get<SecurityLevel[]>(`${this.baseUrl}`);
   }
}
