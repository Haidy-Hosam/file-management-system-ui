import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map, Observable } from 'rxjs';
import { DepartmentLookUp } from '../models/department.model';
import { formatBytes } from '../utils/format-bytes';

@Injectable({ providedIn: 'root' })
export class LookupService {

  private lookupBaseUrl = 'http://localhost:8080/api/lookup';

  constructor(private http: HttpClient) {}

  
  getAllDepartmentsForUpload(): Observable<DepartmentLookUp[]> {
    return this.http.get<DepartmentLookUp[]>(`${this.lookupBaseUrl}/departments`);
  }

}