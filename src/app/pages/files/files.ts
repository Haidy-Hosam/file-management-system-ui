import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { FileService, FileResponse, FileRequest } from '../../core/services/file.service';
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

    // ADMIN sees everything; MANAGER/EMPLOYEE are restricted to their own
    // department, per the controller's @PreAuthorize check on /dept/{deptId}.
    let request$;
    if (role === 'ADMIN') {
      request$ = this.fileService.getAllFiles();
    } else {
      const deptId = this.authService.getDeptId();
      if (deptId == null) {
        this.errorMessage = 'No department found for current user.';
        this.isLoading = false;
        return;
      }
      request$ = this.fileService.getAllFilesByDepartment(deptId);
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
  // The backend requires department_id and fileType_id on every upload
  // (FileRequest). There's currently no dropdown data source wired into
  // this component for departments/file types, so these are left as
  // placeholders you'll need to populate (e.g. from a DepartmentService /
  // FileTypeService) before this will work end-to-end.
  selectedUploadFile: File | null = null;
  selectedDepartmentId: number | null = null;
  selectedFileTypeId: number | null = null;

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

    if (this.selectedDepartmentId == null || this.selectedFileTypeId == null) {
      this.errorMessage = 'Please select a department and file type before uploading.';
      return;
    }

    const request: FileRequest = {
      file: this.selectedUploadFile,
      department_id: this.selectedDepartmentId,
      fileType_id: this.selectedFileTypeId
    };

    this.fileService.uploadFile(request).subscribe({
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