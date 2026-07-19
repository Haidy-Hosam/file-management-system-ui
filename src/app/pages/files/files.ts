import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { FileService, FileResponse } from '../../core/services/file.service';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-files',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './files.html',
  styleUrl: './files.css'
})
export class Files implements OnInit {
  allFiles: FileResponse[] = [];
  filteredFiles: FileResponse[] = [];
  isLoading = true;
  errorMessage = '';

  searchTerm = '';
  activeTab: 'ALL' | 'ACTIVE' | 'ARCHIVED' = 'ALL';

  selectedFileIds = new Set<number>();
  openMenuFileId: number | null = null;

  // pagination
  currentPage = 1;
  pageSize = 8;

  constructor(
    private fileService: FileService,
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadFiles();
  }

  loadFiles(): void {
    this.isLoading = true;
    const role = this.authService.getRole();

    let request$;
    if (role === 'ADMIN') {
      request$ = this.fileService.getAllFiles();
    } else if (role === 'MANAGER') {
      request$ = this.fileService.getMyDepartmentFiles();
    } else {
      request$ = this.fileService.getMyFiles();
    }

    request$.subscribe({
      next: (files: FileResponse[]) => {
        this.allFiles = files;
        this.applyFilters();
        this.isLoading = false;
      },
      error: (err: HttpErrorResponse) => {
        this.errorMessage = 'Failed to load files.';
        this.isLoading = false;
      }
    });
  }

  applyFilters(): void {
    let result = [...this.allFiles];

    if (this.activeTab !== 'ALL') {
      result = result.filter(f => f.status.toUpperCase() === this.activeTab);
    }

    if (this.searchTerm.trim()) {
      const term = this.searchTerm.toLowerCase();
      result = result.filter(f =>
        f.name.toLowerCase().includes(term) ||
        f.ownerName.toLowerCase().includes(term) ||
        f.departmentName.toLowerCase().includes(term)
      );
    }

    this.filteredFiles = result;
    this.currentPage = 1;
  }

  setTab(tab: 'ALL' | 'ACTIVE' | 'ARCHIVED'): void {
    this.activeTab = tab;
    this.applyFilters();
  }

  onSearchChange(): void {
    this.applyFilters();
  }

  get paginatedFiles(): FileResponse[] {
    const start = (this.currentPage - 1) * this.pageSize;
    return this.filteredFiles.slice(start, start + this.pageSize);
  }

  get totalPages(): number {
    return Math.max(1, Math.ceil(this.filteredFiles.length / this.pageSize));
  }

  goToPage(page: number): void {
    this.currentPage = page;
  }

  toggleSelectAll(event: Event): void {
    const checked = (event.target as HTMLInputElement).checked;
    if (checked) {
      this.paginatedFiles.forEach(f => this.selectedFileIds.add(f.id));
    } else {
      this.paginatedFiles.forEach(f => this.selectedFileIds.delete(f.id));
    }
  }

  toggleSelectFile(fileId: number): void {
    if (this.selectedFileIds.has(fileId)) {
      this.selectedFileIds.delete(fileId);
    } else {
      this.selectedFileIds.add(fileId);
    }
  }

  isSelected(fileId: number): boolean {
    return this.selectedFileIds.has(fileId);
  }

  toggleMenu(fileId: number, event: Event): void {
    event.stopPropagation();
    this.openMenuFileId = this.openMenuFileId === fileId ? null : fileId;
  }

  closeMenu(): void {
    this.openMenuFileId = null;
  }

  // ---- File upload ----
  selectedUploadFile: File | null = null;

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.selectedUploadFile = input.files[0];
      this.uploadFile();
    }
  }

  triggerUpload(fileInput: HTMLInputElement): void {
    fileInput.click();
  }

  uploadFile(): void {
    if (!this.selectedUploadFile) return;

    const formData = new FormData();
    formData.append('file', this.selectedUploadFile);

    this.fileService.uploadFile(formData).subscribe({
      next: (response: FileResponse) => {
        this.selectedUploadFile = null;
        this.loadFiles();
      },
      error: (err: HttpErrorResponse) => {
        this.errorMessage = 'Upload failed. Please try again.';
      }
    });
  }

  // ---- Row actions ----
  viewDetails(fileId: number): void {
    this.router.navigate(['/files', fileId]);
  }

  downloadFile(file: FileResponse): void {
    this.fileService.downloadFile(file.id).subscribe({
      next: (blob: Blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = file.name;
        a.click();
        window.URL.revokeObjectURL(url);
      },
      error: (err: HttpErrorResponse) => {
        this.errorMessage = 'Download failed.';
      }
    });
    this.closeMenu();
  }

  previewFile(file: FileResponse): void {
    this.fileService.downloadFile(file.id).subscribe({
      next: (blob: Blob) => {
        const url = window.URL.createObjectURL(blob);
        window.open(url, '_blank');
      },
      error: (err: HttpErrorResponse) => {
        this.errorMessage = 'Preview failed.';
      }
    });
    this.closeMenu();
  }

  deleteFile(file: FileResponse): void {
    if (!confirm(`Delete "${file.name}"? This cannot be undone.`)) return;

    this.fileService.deleteFile(file.id).subscribe({
      next: () => this.loadFiles(),
      error: (err: HttpErrorResponse) => {
        this.errorMessage = 'Delete failed. You may not have permission.';
      }
    });
    this.closeMenu();
  }

  approveFile(file: FileResponse): void {
    this.fileService.updateFileStatus(file.id, 'APPROVED').subscribe({
      next: () => this.loadFiles(),
      error: (err: HttpErrorResponse) => {
        this.errorMessage = 'Status update failed.';
      }
    });
    this.closeMenu();
  }

  rejectFile(file: FileResponse): void {
    this.fileService.updateFileStatus(file.id, 'REJECTED').subscribe({
      next: () => this.loadFiles(),
      error: (err: HttpErrorResponse) => {
        this.errorMessage = 'Status update failed.';
      }
    });
    this.closeMenu();
  }

  archiveFile(file: FileResponse): void {
    this.fileService.updateFileStatus(file.id, 'ARCHIVED').subscribe({
      next: () => this.loadFiles(),
      error: (err: HttpErrorResponse) => {
        this.errorMessage = 'Status update failed.';
      }
    });
    this.closeMenu();
  }

  // ---- Forward modal ----
  showForwardModal = false;
  forwardFileTarget: FileResponse | null = null;
  forwardDeptId: number | null = null;
  forwardNote = '';

  openForwardModal(file: FileResponse): void {
    this.forwardFileTarget = file;
    this.showForwardModal = true;
    this.closeMenu();
  }

  closeForwardModal(): void {
    this.showForwardModal = false;
    this.forwardFileTarget = null;
    this.forwardDeptId = null;
    this.forwardNote = '';
  }

  submitForward(): void {
    if (!this.forwardFileTarget || !this.forwardDeptId) return;

    this.fileService.forwardFile({
      fileId: this.forwardFileTarget.id,
      toDepartmentId: this.forwardDeptId,
      note: this.forwardNote
    }).subscribe({
      next: () => {
        this.closeForwardModal();
        this.loadFiles();
      },
      error: (err: HttpErrorResponse) => {
        this.errorMessage = 'Forward failed.';
      }
    });
  }

  get role(): string | null {
    return this.authService.getRole();
  }

  getFileIcon(fileType: string): string {
    const map: Record<string, string> = {
      pdf: '📕', docx: '📘', doc: '📘',
      xlsx: '📗', xls: '📗',
      zip: '📦', gz: '📦',
      png: '🖼️', jpg: '🖼️', jpeg: '🖼️'
    };
    return map[fileType.toLowerCase()] ?? '📄';
  }
}