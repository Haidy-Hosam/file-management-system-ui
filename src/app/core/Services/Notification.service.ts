// core/services/notification.service.ts
import { Injectable, OnDestroy, signal } from '@angular/core';
import { HttpClient, HttpDownloadProgressEvent, HttpEventType } from '@angular/common/http';
import { Observable, Subscription } from 'rxjs';
import { FileForwardResponse } from '../models/FileForward.model';
import { ToastService } from './toast.service';

@Injectable({ providedIn: 'root' })
export class NotificationService implements OnDestroy {
  private readonly filesUrl = 'http://localhost:8080/api/files';
  private readonly notificationsUrl = 'http://localhost:8080/api/notifications';

  readonly notifications = signal<FileForwardResponse[]>([]);
  readonly unreadCount = signal<number>(0);
  readonly connected = signal<boolean>(false);

  private streamSub: Subscription | null = null;
  private processedLength = 0;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;

  constructor(private http: HttpClient, private toastService: ToastService) {}

  loadInitial(): void {
    this.http.get<FileForwardResponse[]>(`${this.filesUrl}/forwarded/notifications`)
      .subscribe(list => {
        this.notifications.set(list);
        this.unreadCount.set(list.filter(n => !n.isRead).length);
      });
  }

  getAllNotifications(): Observable<FileForwardResponse[]> {
    return this.http.get<FileForwardResponse[]>(`${this.filesUrl}/forwarded/received`);
  }

  markAsRead(forwardId: number): void {
    this.http.put<FileForwardResponse>(`${this.filesUrl}/forwarded/${forwardId}/open`, {})
      .subscribe(updated => {
        this.notifications.update(list => list.filter(n => n.id !== updated.id));
        this.unreadCount.update(count => Math.max(0, count - 1));
      });
  }

  markAllAsRead(): void {
    this.notifications().filter(n => !n.isRead).forEach(n => this.markAsRead(n.id));
  }

  connect(): void {
    if (this.streamSub) return;
    this.processedLength = 0;
    this.streamSub = this.http.get(`${this.notificationsUrl}/subscribe`, {
      observe: 'events', responseType: 'text', reportProgress: true
    }).subscribe({
      next: event => {
        if (event.type === HttpEventType.Sent) this.connected.set(true);
        if (event.type === HttpEventType.DownloadProgress) {
          this.handleChunk((event as HttpDownloadProgressEvent).partialText ?? '');
        }
      },
      error: () => this.scheduleReconnect(),
      complete: () => this.scheduleReconnect()
    });
  }

  disconnect(): void {
    if (this.reconnectTimer) { clearTimeout(this.reconnectTimer); this.reconnectTimer = null; }
    this.streamSub?.unsubscribe();
    this.streamSub = null;
    this.connected.set(false);
  }

  private scheduleReconnect(): void {
    this.connected.set(false);
    this.streamSub = null;
    this.reconnectTimer = setTimeout(() => this.connect(), 3000);
  }

  private handleChunk(fullText: string): void {
    const unprocessed = fullText.slice(this.processedLength);
    const frames = unprocessed.split('\n\n');
    const complete = frames.slice(0, -1);
    this.processedLength += complete.reduce((sum, f) => sum + f.length + 2, 0);

    for (const frame of complete) {
      const dataLine = frame.split('\n').find(line => line.startsWith('data:'));
      if (!dataLine) continue;
      try {
        const payload: FileForwardResponse = JSON.parse(dataLine.slice(5).trim());
        this.notifications.update(list => [payload, ...list]);
        this.unreadCount.update(count => count + 1);
        this.announceToast(payload);
      } catch { /* ignore malformed frame */ }
    }
  }

  private announceToast(payload: FileForwardResponse): void {
    const isUpload = payload.type === 'DEPARTMENT_UPLOAD';
    this.toastService.show(
      isUpload ? 'New file uploaded' : 'File forwarded to you',
      `${payload.senderName} ${isUpload ? 'uploaded' : 'sent you'} "${payload.fileName}"`
    );
  }

  ngOnDestroy(): void { this.disconnect(); }
}