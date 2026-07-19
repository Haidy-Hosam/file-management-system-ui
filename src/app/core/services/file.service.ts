import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface FileResponse {
  id: number;
  name: string;
  ownerName: string;
  departmentName: string;
  departmentId: number;
  sizeLabel: string;
  modifiedDate: string;
  status: string; // e.g. 'ACTIVE' | 'ARCHIVED' | 'PENDING' | 'APPROVED' | 'REJECTED'
  tags: string[];
  fileType: string; // e.g. 'pdf', 'docx', 'xlsx', 'zip', 'png'
}

export interface FileForwardRequest {
  fileId: number;
  toDepartmentId: number;
  note?: string;
}

@Injectable({ providedIn: 'root' })
export class FileService {
  private baseUrl = 'http://localhost:8080/api/files';

  constructor(private http: HttpClient) {}

  uploadFile(formData: FormData): Observable<FileResponse> {
    return this.http.post<FileResponse>(this.baseUrl, formData);
  }

  deleteFile(fileId: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${fileId}`);
  }

  getAllFiles(): Observable<FileResponse[]> {
    return this.http.get<FileResponse[]>(`${this.baseUrl}/all`);
  }

  getMyFiles(): Observable<FileResponse[]> {
    return this.http.get<FileResponse[]>(`${this.baseUrl}/my-files`);
  }

  getMyDepartmentFiles(): Observable<FileResponse[]> {
    return this.http.get<FileResponse[]>(`${this.baseUrl}/my-department`);
  }

  getFileData(fileId: number): Observable<FileResponse> {
    return this.http.get<FileResponse>(`${this.baseUrl}/${fileId}`);
  }

  downloadFile(fileId: number): Observable<Blob> {
    return this.http.get(`${this.baseUrl}/${fileId}/download`, { responseType: 'blob' });
  }

  updateFileStatus(fileId: number, status: string): Observable<FileResponse> {
    return this.http.put<FileResponse>(`${this.baseUrl}/${fileId}/status`, { status });
  }

  forwardFile(request: FileForwardRequest): Observable<any> {
    return this.http.post(`${this.baseUrl}/forward`, request);
  }
}