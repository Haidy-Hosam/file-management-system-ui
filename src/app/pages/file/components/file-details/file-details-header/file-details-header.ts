import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';
import { FileResponse } from '../../../services/file.service';

type TabId = 'overview' | 'activity' | 'permissions' | 'approval';

@Component({
  selector: 'app-file-details-header',
  standalone: true,
  imports: [
    CommonModule,
    TranslatePipe
  ],
  templateUrl: './file-details-header.html',
  styleUrl: './file-details-header.css'
})
export class FileDetailsHeader {
  @Input() file: FileResponse | null = null;
  @Input() tabs: { id: TabId; label: string }[] = [];
  @Input() activeTab: TabId = 'overview';

  @Output() back = new EventEmitter<void>();
  @Output() preview = new EventEmitter<void>();
  @Output() download = new EventEmitter<void>();
  @Output() edit = new EventEmitter<void>();
  @Output() tabChange = new EventEmitter<TabId>();

  goBack(): void {
    this.back.emit();
  }

  previewFile(): void {
    this.preview.emit();
  }

  downloadFile(): void {
    this.download.emit();
  }

  editFile(): void {
    this.edit.emit();
  }

  setTab(tabId: TabId): void {
    this.tabChange.emit(tabId);
  }
}
