import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Department {
  id: number;
  name: string;
}

@Injectable({ providedIn: 'root' })
export class DepartmentService {
  // ASSUMPTION: adjust to match your actual controller if different.
  private baseUrl = 'http://localhost:8080/api/departments';

  constructor(private http: HttpClient) {}

  getAllDepartments(): Observable<Department[]> {
    return this.http.get<Department[]>(this.baseUrl);
  }
}