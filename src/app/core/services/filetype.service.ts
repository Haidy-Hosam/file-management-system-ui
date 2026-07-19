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

  constructor(private http: HttpClient) {}

  getAllFileTypes(): Observable<FileType[]> {
    return this.http.get<FileType[]>(this.baseUrl);
  }
}