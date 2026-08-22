import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { FileResponse, PageResponse } from '../../pages/file/services/file.service';
import { HttpClient, HttpParams } from '@angular/common/http';

export interface TrashItem extends FileResponse {
  //deletedDate: string;
}

@Injectable({ providedIn: 'root' })
export class TrashService {
  private STORAGE_KEY = 'adib_deleted_files';
  private trashSubject = new BehaviorSubject<TrashItem[]>(this.loadFromStorage());
  public trash$: Observable<TrashItem[]> = this.trashSubject.asObservable();

  private baseUrl = 'http://localhost:8080/api/files';


  constructor(private http: HttpClient) {}

  private loadFromStorage(): TrashItem[] {
    try {
      const data = localStorage.getItem(this.STORAGE_KEY);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }

  private saveToStorage(items: TrashItem[]): void {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(items));
    } catch (e) {
      console.error('Failed to save trash items to storage', e);
    }
    this.trashSubject.next(items);
  }

  getDeletedFiles(): TrashItem[] {
    return this.trashSubject.value;
  }

  moveToTrash(file: FileResponse): void {
    const current = this.getDeletedFiles();
    // Avoid duplicate entries if already in trash
    const exists = current.some((item) => item.id === file.id);
    if (!exists) {
      const trashItem: TrashItem = {
        ...file,
        status: 'REJECTED',
       //deletedDate: new Date().toISOString().split('T')[0],
      };
      const updated = [trashItem, ...current];
      this.saveToStorage(updated);
    }
  }

  moveToTrashBulk(files: FileResponse[]): void {
    const current = this.getDeletedFiles();
    const now = new Date().toISOString().split('T')[0];
    const newItems: TrashItem[] = files
      .filter((file) => !current.some((item) => item.id === file.id))
      .map((file) => ({
        ...file,
        status: 'REJECTED',
        deletedDate: now,
      }));
    if (newItems.length > 0) {
      this.saveToStorage([...newItems, ...current]);
    }
  }

  restoreFile(fileId: number): TrashItem | null {
    const current = this.getDeletedFiles();
    const itemToRestore = current.find((item) => item.id === fileId) ?? null;
    if (itemToRestore) {
      const updated = current.filter((item) => item.id !== fileId);
      this.saveToStorage(updated);
    }
    return itemToRestore;
  }

  permanentlyDeleteFile(fileId: number): void {
    const current = this.getDeletedFiles();
    const updated = current.filter((item) => item.id !== fileId);
    this.saveToStorage(updated);
  }

  emptyTrash(): void {
    this.saveToStorage([]);
  }

   gettrashCount(): Observable<number>{
    return this.http.get<number>(`${this.baseUrl}/TrashCount`);
  }
  
  private buildPageParams(page: number, size: number, sortBy?: string, sortDir?: 'asc' | 'desc'): HttpParams {
    let params = new HttpParams().set('page', page).set('size', size);
    if (sortBy) {
      params = params.set('sortBy', sortBy);
      if (sortDir) params = params.set('sortDir', sortDir);
    }
    return params;
  }

  deleteFile(fileId: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${fileId}`);
  }
  listDeletedFiles(page: number, size: number): Observable<PageResponse<FileResponse>> {
      const params = this.buildPageParams(page, size);
      return this.http.get<PageResponse<FileResponse>>(`${this.baseUrl}/trash`, { params });
    }
}
