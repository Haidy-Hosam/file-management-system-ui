import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { FileResponse, FileRequest, PageResponse } from '../../models/file.model';
import { FileSearchRequest } from '../../models/file-search-request.model';

export type { FileResponse, FileRequest, PageResponse };

@Injectable({ providedIn: 'root' })
export class FileService {
  private baseUrl = 'http://localhost:8080/api/files';

  constructor(private http: HttpClient) {}

  uploadFile(request: FileRequest): Observable<FileResponse> {
    const formData = new FormData();
    formData.append('file', request.file);
    formData.append('department_id', request.department_id.toString());
    formData.append('fileType_id', request.fileType_id.toString());
    return this.http.post<FileResponse>(this.baseUrl, formData);
  }

  uploadFilesBulk(
    items: { file: File; fileTypeId: number; securityLevelId?: number | null }[],
    departmentIds: number[]
  ): Observable<FileResponse[]> {
    const formData = new FormData();

    items.forEach(item => {
      formData.append('files', item.file);
      formData.append('fileTypeIds', item.fileTypeId.toString());
      if (item.securityLevelId != null) {
        formData.append('securityLevelIds', item.securityLevelId.toString());
      }
    });

    departmentIds.forEach(id => {
      formData.append('departmentIds', id.toString());
    });

    return this.http.post<FileResponse[]>(`${this.baseUrl}/bulk`, formData);
  }

  deleteFile(fileId: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${fileId}`);
  }

  private buildPageParams(page: number, size: number, sortBy?: string, sortDir?: 'asc' | 'desc'): HttpParams {
    let params = new HttpParams().set('page', page).set('size', size);
    if (sortBy) {
      params = params.set('sortBy', sortBy);
      if (sortDir) params = params.set('sortDir', sortDir);
    }
    return params;
  }

  // CHANGED: was getAllFiles() hitting /all — now hits the bare, scoped
  // endpoint. Backend decides READ_ALL vs READ_SCOPED; this call is
  // identical for every role, it's just what comes back that differs.
  listFiles(page: number, size: number, sortBy?: string, sortDir?: 'asc' | 'desc'): Observable<PageResponse<FileResponse>> {
    const params = this.buildPageParams(page, size, sortBy, sortDir);
    return this.http.get<PageResponse<FileResponse>>(this.baseUrl, { params });
  }

  // kept — used for department drill-down (e.g. from Department details page),
  // now enforced server-side so a Manager can't pass an arbitrary deptId
  getAllFilesByDepartment(deptId: number, page: number, size: number, sortBy?: string, sortDir?: 'asc' | 'desc'): Observable<PageResponse<FileResponse>> {
    const params = this.buildPageParams(page, size, sortBy, sortDir);
    return this.http.get<PageResponse<FileResponse>>(`${this.baseUrl}/dept/${deptId}`, { params });
  }

  // kept — used for "files by this user" drill-down (e.g. from Users page),
  // now enforced server-side against the target user's department
  getFilesByUser(userId: number, page: number, size: number, sortBy?: string, sortDir?: 'asc' | 'desc'): Observable<PageResponse<FileResponse>> {
    const params = this.buildPageParams(page, size, sortBy, sortDir);
    return this.http.get<PageResponse<FileResponse>>(`${this.baseUrl}/user/${userId}`, { params });
  }

  // REMOVED: getMyFiles() — /my endpoint dropped per the earlier cleanup.
  // Re-add if you build a distinct "My Uploads" view later.

  getFileData(fileId: number): Observable<FileResponse> {
    return this.http.get<FileResponse>(`${this.baseUrl}/${fileId}`);
  }

  downloadFile(fileId: number): Observable<Blob> {
    return this.http.get(`${this.baseUrl}/${fileId}/download`, { responseType: 'blob' });
  }

  updateFileStatus(fileId: number, status: string): Observable<FileResponse> {
    return this.http.put<FileResponse>(`${this.baseUrl}/${fileId}/status`, { status });
  }

  downloadFilesBulk(fileIds: number[]): Observable<Blob> {
    return this.http.post(`${this.baseUrl}/download-bulk`, fileIds, { responseType: 'blob' });
  }

  searchFiles(request: FileSearchRequest): Observable<PageResponse<FileResponse>> {
    return this.http.post<PageResponse<FileResponse>>(`${this.baseUrl}/search`, request);
  }

  // kept — used by trash page, points at GET /trash which is now canRead-gated
  listDeletedFiles(page: number, size: number): Observable<PageResponse<FileResponse>> {
    const params = this.buildPageParams(page, size);
    return this.http.get<PageResponse<FileResponse>>(`${this.baseUrl}/trash`, { params });
  }

  getMyFiles(page: number, size: number, sortBy?: string, sortDir?: 'asc' | 'desc'): Observable<PageResponse<FileResponse>> {
  const params = this.buildPageParams(page, size, sortBy, sortDir);
  return this.http.get<PageResponse<FileResponse>>(`${this.baseUrl}/my`, { params });
}
}