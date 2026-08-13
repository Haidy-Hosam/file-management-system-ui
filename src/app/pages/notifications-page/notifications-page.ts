// pages/notifications-page/notifications-page.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NotificationService } from '../../core/services/Notification.service';
import { FileForwardResponse } from '../file/models/FileForward.model';
import { Router } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';

@Component({
  selector: 'app-notifications-page',
  standalone: true,
  imports: [CommonModule, TranslatePipe],
  templateUrl: './notifications-page.html',
  styleUrl: './notifications-page.css'
})
export class NotificationsPage implements OnInit {
  notifications: FileForwardResponse[] = [];
  loading = true;

  constructor(private notificationService: NotificationService, private router: Router) {}

  ngOnInit(): void {
    this.notificationService.getAllNotifications().subscribe(list => {
      this.notifications = list;
      this.loading = false;
    });
  }

  open(n: FileForwardResponse): void {
  if (!n.isRead) { this.notificationService.markAsRead(n.id); n.isRead = true; }
  this.router.navigate(['/files'], { queryParams: { previewFileId: n.fileId } });
}
}