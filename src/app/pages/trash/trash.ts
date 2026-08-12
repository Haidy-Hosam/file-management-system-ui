import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { TrashService, TrashItem } from '../../core/services/trash.service';
import { AuthService } from '../../core/services/auth.service';
import { TranslatePipe } from '@ngx-translate/core';
import { PermissionsService } from '../../core/services/permissions.service';

@Component({
  selector: 'app-trash',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, TranslatePipe],
  templateUrl: './trash.html',
  styleUrl: './trash.css',
})
export class Trash implements OnInit {
  deletedFiles: TrashItem[] = [];
  filteredFiles: TrashItem[] = [];
  searchTerm = '';
  selectedIds = new Set<number>();
  errorMessage = '';

  constructor(
    private trashService: TrashService,
    private permissionsService: PermissionsService,
    private router:Router
  ) {}

  ngOnInit(): void {
    //  if (this.permissionsService.has('files','DELETE')) {
    //    this.router.navigate(['/files']);
    //    return;
    //  }

    this.trashService.trash$.subscribe((items) => {
      this.deletedFiles = items;
      this.applyFilter();
    });
  }

  applyFilter(): void {
    if (!this.searchTerm.trim()) {
      this.filteredFiles = [...this.deletedFiles];
    } else {
      const term = this.searchTerm.toLowerCase();
      this.filteredFiles = this.deletedFiles.filter(
        (f) =>
          f.name.toLowerCase().includes(term) ||
          f.fileType?.toLowerCase().includes(term) ||
          f.departmentNames?.some((d) => d.toLowerCase().includes(term))
      );
    }
  }

  onSearchChange(): void {
    this.applyFilter();
  }

  toggleSelectAll(event: Event): void {
    const checked = (event.target as HTMLInputElement).checked;
    if (checked) {
      this.filteredFiles.forEach((f) => this.selectedIds.add(f.id));
    } else {
      this.selectedIds.clear();
    }
  }

  toggleSelect(fileId: number): void {
    if (this.selectedIds.has(fileId)) {
      this.selectedIds.delete(fileId);
    } else {
      this.selectedIds.add(fileId);
    }
  }

  isAllSelected(): boolean {
    return (
      this.filteredFiles.length > 0 &&
      this.filteredFiles.every((f) => this.selectedIds.has(f.id))
    );
  }

  restoreSingle(file: TrashItem): void {
    this.trashService.restoreFile(file.id);
    this.selectedIds.delete(file.id);
  }

  restoreSelected(): void {
    if (this.selectedIds.size === 0) return;
    this.selectedIds.forEach((id) => this.trashService.restoreFile(id));
    this.selectedIds.clear();
  }

  permanentlyDeleteSingle(file: TrashItem): void {
    if (!confirm(`Permanently delete "${file.name}"? This cannot be undone.`)) return;
    this.trashService.permanentlyDeleteFile(file.id);
    this.selectedIds.delete(file.id);
  }

  permanentlyDeleteSelected(): void {
    if (this.selectedIds.size === 0) return;
    if (!confirm(`Permanently delete ${this.selectedIds.size} file(s)? This cannot be undone.`)) return;
    this.selectedIds.forEach((id) => this.trashService.permanentlyDeleteFile(id));
    this.selectedIds.clear();
  }

  clearAllTrash(): void {
    if (!confirm('Are you sure you want to permanently delete all items in the Trash?')) return;
    this.trashService.emptyTrash();
    this.selectedIds.clear();
  }

  getFileIcon(ext: string): string {
    const lower = ext?.toLowerCase() || '';
    if (['pdf'].includes(lower)) return 'bi-file-earmark-pdf text-danger';
    if (['doc', 'docx'].includes(lower)) return 'bi-file-earmark-word text-primary';
    if (['xls', 'xlsx', 'csv'].includes(lower)) return 'bi-file-earmark-excel text-success';
    if (['jpg', 'jpeg', 'png', 'gif', 'svg'].includes(lower)) return 'bi-file-earmark-image text-info';
    if (['zip', 'rar', '7z'].includes(lower)) return 'bi-file-earmark-zip text-warning';
    return 'bi-file-earmark-text text-secondary';
  }
}
