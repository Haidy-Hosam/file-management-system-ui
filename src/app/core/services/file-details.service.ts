import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface FileVersion {
  id: number;
  version: string;
  title: string;
  author: string;
  date: string;
  isCurrent: boolean;
}

export interface FileActivity {
  id: number;
  action: string; // e.g. "Downloaded"
  by: string;
  date: string;
}

export interface FilePermission {
  id: number;
  name: string;
  subtitle: string; // role/group label e.g. "Owner", "Manager", "Group"
  access: string; // e.g. "Full Access", "Can Edit", "Can View"
  isGroup: boolean;
}

export interface AddPermissionRequest {
  targetId: number;
  isGroup: boolean;
  access: string;
}

@Injectable({ providedIn: 'root' })
export class FileDetailsService {
  private baseUrl = 'http://localhost:8080/api/files';

  constructor(private http: HttpClient) {}

  // GET /api/files/{fileId}/versions
  getVersions(fileId: number): Observable<FileVersion[]> {
    return this.http.get<FileVersion[]>(`${this.baseUrl}/${fileId}/versions`);
  }

  // GET /api/files/{fileId}/versions/{versionId}/download
  downloadVersion(fileId: number, versionId: number): Observable<Blob> {
    return this.http.get(`${this.baseUrl}/${fileId}/versions/${versionId}/download`, {
      responseType: 'blob',
    });
  }

  // GET /api/files/{fileId}/activity
  getActivity(fileId: number): Observable<FileActivity[]> {
    return this.http.get<FileActivity[]>(`${this.baseUrl}/${fileId}/activity`);
  }

  // GET /api/files/{fileId}/permissions
  getPermissions(fileId: number): Observable<FilePermission[]> {
    return this.http.get<FilePermission[]>(`${this.baseUrl}/${fileId}/permissions`);
  }

  // POST /api/files/{fileId}/permissions
  addPermission(fileId: number, request: AddPermissionRequest): Observable<FilePermission> {
    return this.http.post<FilePermission>(`${this.baseUrl}/${fileId}/permissions`, request);
  }

  // DELETE /api/files/{fileId}/permissions/{permissionId}
  removePermission(fileId: number, permissionId: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${fileId}/permissions/${permissionId}`);
  }
}