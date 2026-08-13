import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';

@Component({
  selector: 'app-file-preview',
  standalone: true,
  imports: [
    CommonModule,
    TranslatePipe
  ],
  templateUrl: './file-preview.html',
  styleUrl: './file-preview.css',
})
export class FilePreview {

  // =========================================================
  // INPUTS
  // =========================================================

  @Input() showPreviewModal = false;

  @Input() previewModalFile: any = null;

  @Input() isLoadingPreview = false;

  @Input() previewKind: 'image' | 'pdf' | 'text' | 'unsupported' | null = null;

  @Input() previewUrl: any = null;

  @Input() previewText = '';


  // =========================================================
  // OUTPUTS
  // =========================================================

  @Output() close = new EventEmitter<void>();

  @Output() download = new EventEmitter<void>();


  // =========================================================
  // EVENTS
  // =========================================================

  closePreview(): void {
    this.close.emit();
  }

  downloadPreview(): void {
    this.download.emit();
  }
}