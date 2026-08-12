import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map, Observable } from 'rxjs';
import { DepartmentDetails, Department, CreateDepartmentRequest, ReassignmentItem } from '../models/department.model';
import { formatBytes } from '../utils/format-bytes';


const THEME_COLORS = ['#2563eb', '#0ea5e9', '#3b82f6', '#64748b', '#1e293b', '#7dd3fc'];

@Injectable({ providedIn: 'root' })
export class DepartmentService {
  private baseUrl = 'http://localhost:8080/api/departments';
  private lookupBaseUrl = 'http://localhost:8080/api/lookup/departments';

  constructor(private http: HttpClient) {}

  getAllDepartments(): Observable<Department[]> {
    return this.http.get<DepartmentDetails[]>(this.baseUrl).pipe(
      map(list => list.map((dept , index) => this.toViewModel(dept, index)))
    );
  }

  createDepartment(request: CreateDepartmentRequest): Observable<DepartmentDetails> {
    return this.http.post<DepartmentDetails>(this.baseUrl, request);
  }

  getDepartmentDetails(id: string): Observable<DepartmentDetails> {
    return this.http.get<DepartmentDetails>(`${this.baseUrl}/details/${id}`);
  }

  deleteDepartment(id: string,reassignments?: ReassignmentItem[]): Observable<void> {
   const body = reassignments ? { reassignments } : {};
  return this.http.delete<void>(`${this.baseUrl}/${id}`, { body });
  }

  activateDepartment(id: string): Observable<void> {
  return this.http.patch<void>(`${this.baseUrl}/${id}/activate`, {});
  }

  updateDepartment(id: string, request: CreateDepartmentRequest): Observable<DepartmentDetails> {
  return this.http.put<DepartmentDetails>(`${this.baseUrl}/${id}`, request);
  }

  private toViewModel(dept: DepartmentDetails, index: number): Department {
    return {
      id: dept.id,
      name: dept.name,
      head: dept.managerName ?? 'Unassigned',
      members: dept.employeeCount,
      files: dept.fileCount,
      storage: formatBytes(dept.storageUsed),
      status: dept.isActive ? 'Active' : 'Inactive',
      themeColor: THEME_COLORS[index % THEME_COLORS.length],
    };
  }

  getLookupDepartments(): Observable<Department[]> {
    return this.http.get<Department[]>(this.lookupBaseUrl);
  }

  /**
   * Returns ALL departments regardless of the caller's role.
   * Used by the upload wizard so any user can route a file to any department.
   * Hits /api/departments which is not filtered by the backend.
   */
  getAllDepartmentsForUpload(): Observable<Department[]> {
    return this.http.get<DepartmentDetails[]>(this.baseUrl).pipe(
      map(list => list.map((dept, index) => ({
        id: dept.id,
        name: dept.name,
        head: dept.managerName ?? 'Unassigned',
        members: dept.employeeCount,
        files: dept.fileCount,
        storage: formatBytes(dept.storageUsed),
        status: dept.isActive ? 'Active' : 'Inactive',
        themeColor: THEME_COLORS[index % THEME_COLORS.length],
      })))
    );
  }

}