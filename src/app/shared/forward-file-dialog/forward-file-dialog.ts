// shared/forward-file-dialog/forward-file-dialog.ts
import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FileForwardService } from '../../pages/file/services/file-forward.service';
import { UserService } from '../../core/services/user.service'; // adjust to your actual service
import { UserResponse } from '../../core/services/user.service';
import { TranslatePipe } from '@ngx-translate/core';


@Component({
  selector: 'app-forward-file-dialog',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslatePipe],
  templateUrl: './forward-file-dialog.html',
  styleUrl: './forward-file-dialog.css'
})
export class ForwardFileDialog implements OnInit {
  @Input({ required: true }) fileId!: number;
  @Output() closed = new EventEmitter<void>();
  @Output() forwarded = new EventEmitter<void>();

  users: UserResponse[] = [];
  selectedIds = new Set<number>();
  message = '';
  submitting = false;

  constructor(private fileForwardService: FileForwardService, private userService: UserService) {}

  ngOnInit(): void {
    this.userService.getAllUsers().subscribe(list => this.users = list);
  }

  toggleUser(id: number): void {
    this.selectedIds.has(id) ? this.selectedIds.delete(id) : this.selectedIds.add(id);
  }

  submit(): void {
    if (this.selectedIds.size === 0 || this.submitting) return;
    this.submitting = true;
    this.fileForwardService.forward(this.fileId, {
      recipientIds: Array.from(this.selectedIds),
      message: this.message
    }).subscribe({
      next: () => { this.submitting = false; this.forwarded.emit(); this.closed.emit(); },
      error: () => this.submitting = false
    });
  }

  cancel(): void { this.closed.emit(); }
}