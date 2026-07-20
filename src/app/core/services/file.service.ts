import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface FileResponse {
  id: number;
  name: string;
  extension: string;
  departmentName: string;
  departmentId: number;
  size: string;
  modifiedDate: string;
  status: string;
  fileType: string;
}

export interface FileRequest {
  file: File;
  department_id: number;
  fileType_id: number;
}

@Injectable({ providedIn: 'root' })
export class FileService {
  private baseUrl = 'http://localhost:8080/api/files';

  constructor(private http: HttpClient) {}

  // POST /api/files (multipart/form-data) -> createFile
  uploadFile(request: FileRequest): Observable<FileResponse> {
    const formData = new FormData();
    formData.append('file', request.file);
    formData.append('department_id', request.department_id.toString());
    formData.append('fileType_id', request.fileType_id.toString());
    return this.http.post<FileResponse>(this.baseUrl, formData);
  }

  // DELETE /api/files/{fileId} -> deleteFile
  deleteFile(fileId: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${fileId}`);
  }

  // GET /api/files/all -> getAllFiles
  getAllFiles(): Observable<FileResponse[]> {
    return this.http.get<FileResponse[]>(`${this.baseUrl}/all`);
  }

  // GET /api/files/dept/{deptId} -> getAllFilesByDepartment
  getAllFilesByDepartment(deptId: number): Observable<FileResponse[]> {
    return this.http.get<FileResponse[]>(`${this.baseUrl}/dept/${deptId}`);
  }

  // GET /api/files/{fileId} -> getFileData
  getFileData(fileId: number): Observable<FileResponse> {
    return this.http.get<FileResponse>(`${this.baseUrl}/${fileId}`);
  }

  // GET /api/files/{fileId}/download -> downloadFile
  downloadFile(fileId: number): Observable<Blob> {
    return this.http.get(`${this.baseUrl}/${fileId}/download`, { responseType: 'blob' });
  }

  // PUT /api/files/{fileId}/status -> updateFileStatus
  updateFileStatus(fileId: number, status: string): Observable<FileResponse> {
    return this.http.put<FileResponse>(`${this.baseUrl}/${fileId}/status`, { status });
  }
}