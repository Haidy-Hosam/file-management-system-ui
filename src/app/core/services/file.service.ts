import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface FileResponse {
  id: number;
  name: string;
  extension: string;
  departmentNames: string[]; // CHANGED
  size: string;
  modifiedDate: string;
  createdDate: string;
  status: string;
  fileType: string;
  ownerName: string;
}

export interface FileRequest {
  file: File;
  department_id: number;
  fileType_id: number;
}

export interface PageResponse<T> {
  content: T[];
  totalElements: number ;
  totalPages: number;
  size: number;
  number: number;

  first: boolean;
  last: boolean;
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
  

  uploadFilesBulk(
    items: { file: File; fileTypeId: number }[],
    departmentIds: number[]
  ): Observable<FileResponse[]> {
    const formData = new FormData();
 
    
    items.forEach(item => {
      formData.append('files', item.file);
      formData.append('fileTypeIds', item.fileTypeId.toString());
    });
 
    departmentIds.forEach(id => {
      formData.append('departmentIds', id.toString());
    });
 
    return this.http.post<FileResponse[]>(`${this.baseUrl}/bulk`, formData);
  }
 

  
  deleteFile(fileId: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${fileId}`);
  }


  getAllFiles(page: number, size:number): Observable<PageResponse<FileResponse>> {
    const params = new HttpParams().set('page', page).set('size', size);
    return this.http.get<PageResponse<FileResponse>>(`${this.baseUrl}/all`, {params});
  }

  getFilesByUser(userId: number, page: number, size: number): Observable<PageResponse<FileResponse>> {
  const params = new HttpParams().set('page', page).set('size', size);
  return this.http.get<PageResponse<FileResponse>>(`${this.baseUrl}/user/${userId}`, { params });
}
  getAllFilesByDepartment(deptId: number, page:number , size: number): Observable<PageResponse<FileResponse>> {
    return this.http.get<PageResponse<FileResponse>>(`${this.baseUrl}/dept/${deptId}?page=${page}&size=${size}`);
  }
   
  getMyFiles(page: number, size: number): Observable<PageResponse<FileResponse>> {
  const params = new HttpParams().set('page', page).set('size', size);
  return this.http.get<PageResponse<FileResponse>>(`${this.baseUrl}/my`, { params });
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

  downloadFilesBulk(fileIds: number[]): Observable<Blob> {
  return this.http.post(`${this.baseUrl}/download-bulk`, fileIds, { responseType: 'blob' });
}

}