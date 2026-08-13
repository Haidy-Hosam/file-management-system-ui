// shared/notification-bell/notification-bell.ts
import { Component, HostListener, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { NotificationService } from '../../core/services/Notification.service';
import {FileForwardResponse} from "../../pages/file/models/FileForward.model"
import { TranslatePipe } from '@ngx-translate/core';

@Component({
  selector: 'app-notification-bell',
  standalone: true,
  imports: [CommonModule, TranslatePipe],
  templateUrl: './notification-bell.html',
  styleUrl: './notification-bell.css'
})
export class NotificationBell implements OnInit {
  showDropdown = false;

  constructor(public notificationService: NotificationService, private router: Router) {}

  ngOnInit(): void {
    this.notificationService.loadInitial();
    this.notificationService.connect();
  }

  toggleDropdown(event: Event): void {
    event.stopPropagation();
    this.showDropdown = !this.showDropdown;
  }

  @HostListener('document:click')
  closeDropdown(): void { this.showDropdown = false; }

onNotificationClick(n: FileForwardResponse): void {
  this.notificationService.markAsRead(n.id);
  this.showDropdown = false;
  this.router.navigate(['/profile'], { queryParams: { tab: 'received', forwardId: n.id } });
}

  viewAll(): void {
    this.showDropdown = false;
    this.router.navigate(['/notifications']);
  }
}