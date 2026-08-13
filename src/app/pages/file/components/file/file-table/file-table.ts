import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslatePipe } from '@ngx-translate/core';
import { HasPermissionDirective } from '../../../../../core/directives/has-permission.directive';

@Component({
  selector: 'app-file-table',
  standalone: true,
  imports: [CommonModule, TranslatePipe, HasPermissionDirective],
  templateUrl: './file-table.html',
  styleUrl: './file-table.css',
})
export class FileTable {
  @Input() filteredFiles: any[] = [];

  @Input() sortBy: string | null = null;
  @Input() sortDirection: 'asc' | 'desc' = 'asc';

  @Input() openMenuFileId: any = null;

  @Input() isSelected!: (fileId: any) => boolean;
  @Input() getFileIcon!: (extension: string) => string;
  @Input() getFileIconColor!: (extension: string) => string;

  @Output() selectAll = new EventEmitter<Event>();

  @Output() sortChange = new EventEmitter<'NAME' | 'OWNER' | 'SIZE' | 'CREATED' | 'MODIFIED'>();
  @Output() selectFile = new EventEmitter<any>();

  @Output() viewDetails = new EventEmitter<any>();

  @Output() toggleMenu = new EventEmitter<{
    fileId: any;
    event: Event;
  }>();

  @Output() previewFile = new EventEmitter<any>();

  @Output() downloadFile = new EventEmitter<any>();

  @Output() forwardFile = new EventEmitter<any>();

  @Output() openStatus = new EventEmitter<any>();

  @Output() deleteFile = new EventEmitter<any>();

  onSelectAll(event: Event): void {
    this.selectAll.emit(event);
  }

  onSort(column: 'NAME' | 'OWNER' | 'SIZE' | 'CREATED' | 'MODIFIED'): void {
    this.sortChange.emit(column);
  }

  onSelectFile(fileId: any): void {
    this.selectFile.emit(fileId);
  }

  onViewDetails(fileId: any): void {
    this.viewDetails.emit(fileId);
  }

  onToggleMenu(fileId: any, event: Event): void {
    this.toggleMenu.emit({
      fileId,
      event,
    });
  }

  onPreviewFile(file: any): void {
    this.previewFile.emit(file);
  }

  onDownloadFile(file: any): void {
    this.downloadFile.emit(file);
  }

  onForwardFile(file: any): void {
    this.forwardFile.emit(file);
  }

  onOpenStatus(file: any): void {
    this.openStatus.emit(file);
  }

  onDeleteFile(file: any): void {
    this.deleteFile.emit(file);
  }
}
