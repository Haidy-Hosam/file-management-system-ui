import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface FileType {
  id: number;
  name: string;
}

@Injectable({ providedIn: 'root' })
export class FileTypeService {
  // ASSUMPTION: adjust to match your actual controller if different.
  private baseUrl = 'http://localhost:8080/api/file-types';
  private LookupBaseUrl = 'http://localhost:8080/api/lookup/fileTypes';

  constructor(private http: HttpClient) {}

  getAllFileTypes(): Observable<FileType[]> {
    return this.http.get<FileType[]>(this.baseUrl);
  }

   lookupAllFileTypes(): Observable<FileType[]> {
    return this.http.get<FileType[]>(this.LookupBaseUrl);
  }
}