import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TranslatePipe } from '@ngx-translate/core';

@Component({
  selector: 'app-file-edit-dialog',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    TranslatePipe
  ],
  templateUrl: './file-edit-dialog.html',
  styleUrl: './file-edit-dialog.css',
})
export class FileEditDialog {

  // =========================================================
  // INPUTS
  // =========================================================

  @Input() showStatusModal = false;

  @Input() statusModalFile: any = null;

  @Input() statusOptions: any[] = [];

  @Input() selectedStatus: any = null;

  @Input() isUpdatingStatus = false;

  @Input() canConfirmStatus = false;


  // =========================================================
  // OUTPUTS
  // =========================================================

  @Output() close = new EventEmitter<void>();

  @Output() confirm = new EventEmitter<void>();

  @Output() selectedStatusChange = new EventEmitter<any>();


  // =========================================================
  // EVENTS
  // =========================================================

  closeDialog(): void {
    this.close.emit();
  }

  confirmUpdate(): void {
    this.confirm.emit();
  }

  onStatusChange(status: any): void {
    this.selectedStatusChange.emit(status);
  }
}