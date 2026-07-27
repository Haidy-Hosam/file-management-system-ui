// core/services/toast.service.ts
import { Injectable, signal } from '@angular/core';

export interface ToastMessage { id: number; title: string; message: string; }

@Injectable({ providedIn: 'root' })
export class ToastService {
  readonly toasts = signal<ToastMessage[]>([]);
  private nextId = 0;

  show(title: string, message: string, durationMs = 7000): void {
    const id = this.nextId++;
    this.toasts.update(list => [...list, { id, title, message }]);
    setTimeout(() => this.dismiss(id), durationMs);
  }

  dismiss(id: number): void {
    this.toasts.update(list => list.filter(t => t.id !== id));
  }
}