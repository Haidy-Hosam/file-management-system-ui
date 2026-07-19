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
  file:File;
  department_id:number;
  fileType_id:number;
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
    const formData = new FormData();
    formData.append('file', request.file);
    formData.append('department_id', request.department_id.toString());
    formData.append('fileType_id', request.fileType_id.toString());
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