import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { FileResponse } from './FileServices/file.service';

export interface TrashItem extends FileResponse {
  deletedDate: string;
}

@Injectable({ providedIn: 'root' })
export class TrashService {
  private STORAGE_KEY = 'adib_deleted_files';
  private trashSubject = new BehaviorSubject<TrashItem[]>(this.loadFromStorage());
  public trash$: Observable<TrashItem[]> = this.trashSubject.asObservable();

  constructor() {}

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
        deletedDate: new Date().toISOString().split('T')[0],
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

  get trashCount(): number {
    return this.trashSubject.value.length;
  }
}
