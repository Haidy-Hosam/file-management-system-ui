// core/services/file-forward.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { FileForwardResponse } from '../models/FileForward.model';

export interface ForwardFileRequest { recipientIds: number[]; message: string; }

@Injectable({ providedIn: 'root' })
export class FileForwardService {
  private readonly baseUrl = 'http://localhost:8080/api/files';
  constructor(private http: HttpClient) {}

  forward(fileId: number, request: ForwardFileRequest): Observable<FileForwardResponse[]> {
    return this.http.post<FileForwardResponse[]>(`${this.baseUrl}/${fileId}/forward`, request);
  }
}