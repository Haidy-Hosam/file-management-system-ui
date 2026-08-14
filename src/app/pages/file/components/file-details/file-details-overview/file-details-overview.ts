import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslatePipe } from '@ngx-translate/core';
import { FileResponse } from '../../../services/file.service';

@Component({
  selector: 'app-file-details-overview',
  standalone: true,
  imports: [
    CommonModule,
    TranslatePipe
  ],
  templateUrl: './file-details-overview.html',
  styleUrl: './file-details-overview.css'
})
export class FileDetailsOverview {
  @Input() file: FileResponse | null = null;

  @Output() download = new EventEmitter<void>();
  @Output() edit = new EventEmitter<void>();
  @Output() delete = new EventEmitter<void>();

  onDownload(): void {
    this.download.emit();
  }

  onEdit(): void {
    this.edit.emit();
  }

  onDelete(): void {
    this.delete.emit();
  }
}
