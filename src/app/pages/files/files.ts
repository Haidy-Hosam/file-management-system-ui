import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { FileService, FileResponse, FileRequest } from '../../core/services/file.service';
import { AuthService } from '../../core/services/auth.service';
import { DepartmentService, Department } from '../../core/services/department.service';
import { FileTypeService, FileType } from '../../core/services/filetype.service';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';

interface FileGroup {
  groupId: string;
  name: string;
  fileType: string;
  size: string;
  modifiedDate: string;
  entries: FileResponse[]; // one per department this file was sent to
}

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
  activeTab: 'ALL' | 'PENDING' | 'APPROVED' | 'REJECTED' = 'ALL';

  selectedFileIds = new Set<number>();
  openMenuFileId: number | null = null;
  openGroupMenuId: string | null = null;


  // pagination
  currentPage = 1;
  pageSize = 10;

  constructor(
    private fileService: FileService,
    private authService: AuthService,
    private departmentService: DepartmentService,
    private fileTypeService: FileTypeService,
    private router: Router,
    private sanitizer: DomSanitizer

  ) {}

  ngOnInit(): void {
    this.loadFiles();
    this.loadDepartments();
    this.loadFileTypes();
  }

  departments: Department[] = [];
  fileTypes: FileType[] = [];

  loadDepartments(): void {
    this.departmentService.getLookupDepartments().subscribe({
      next: (depts) => this.departments = depts,
      error: () => this.errorMessage = 'Failed to load departments.'
    });
  }

  loadFileTypes(): void {
    this.fileTypeService.lookupAllFileTypes().subscribe({
      next: (types) => this.fileTypes = types,
      error: () => this.errorMessage = 'Failed to load file types.'
    });
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
      f.departmentNames.some(dept => dept.toLowerCase().includes(term))
    );
  }

  this.filteredFiles = result;
  this.currentPage = 1;
}
  

  setTab(tab: 'ALL' | 'PENDING' | 'APPROVED' | 'REJECTED'): void {
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


  showUploadModal = false;
  isDragging = false;
  isUploading = false;
   uploadItems: { file: File; fileTypeId: number | null }[] = [];
  selectedDepartmentIds: number[] = [];

  currentStep = 1;
  readonly totalSteps = 4;

 get canSubmitUpload(): boolean {
    return this.uploadItems.length > 0 &&
      this.selectedDepartmentIds.length > 0 &&
      this.uploadItems.every(item => item.fileTypeId != null) &&
      !this.isUploading;
  }

  get totalRecordsToCreate(): number {
    return this.uploadItems.length * this.selectedDepartmentIds.length;
  }
openUploadModal(): void {
    this.showUploadModal = true;
    this.uploadItems = [];
    this.selectedDepartmentIds = [];
    this.isDragging = false;
    this.currentStep = 1;
  }

  closeUploadModal(): void {
    if (this.isUploading) return;
    this.showUploadModal = false;
    this.uploadItems = [];
    this.selectedDepartmentIds = [];
    this.isDragging = false;
    this.currentStep = 1;
  }
  nextStep(): void {
    if (this.canGoNext()) {
      this.currentStep++;
    }
  }

  prevStep(): void {
    if (this.currentStep > 1) {
      this.currentStep--;
    }
  }

  goToStep(step: number): void {
    // only allow jumping to a step already reached
    if (step <= this.currentStep) {
      this.currentStep = step;
    }
  }

  canGoNext(): boolean {
    switch (this.currentStep) {
      case 1: return this.uploadItems.length > 0;
      case 2: return this.selectedDepartmentIds.length > 0;
      case 3: return this.uploadItems.every(item => item.fileTypeId != null);
      default: return false;
    }
  }

  private addFiles(files: FileList): void {
    Array.from(files).forEach(file => {
      // skip exact duplicates (same name + size) already in the batch
      const alreadyAdded = this.uploadItems.some(
        item => item.file.name === file.name && item.file.size === file.size
      );
      if (!alreadyAdded) {
        this.uploadItems.push({ file, fileTypeId: null });
      }
    });
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.addFiles(input.files);
      input.value = ''; // allow re-selecting the same file later if removed
    }
  }

  triggerBrowse(fileInput: HTMLInputElement): void {
    fileInput.click();
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging = true;
  }

  onDragLeave(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging = false;
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging = false;

    const files = event.dataTransfer?.files;
    if (files && files.length > 0) {
      this.addFiles(files);
    }
  }

  removeUploadItem(index: number): void {
    this.uploadItems.splice(index, 1);
  }

  toggleDepartmentSelection(deptId: number): void {
    const idx = this.selectedDepartmentIds.indexOf(deptId);
    if (idx > -1) {
      this.selectedDepartmentIds.splice(idx, 1);
    } else {
      this.selectedDepartmentIds.push(deptId);
    }
  }

  isDepartmentSelected(deptId: number): boolean {
    return this.selectedDepartmentIds.includes(deptId);
  }

  getDepartmentName(deptId: number): string {
    return this.departments.find(d => d.id === deptId)?.name ?? 'Unknown';
  }

  getFileTypeName(fileTypeId: number | null): string {
    if (fileTypeId == null) return '—';
    return this.fileTypes.find(t => t.id === fileTypeId)?.name ?? 'Unknown';
  }

  submitUpload(): void {
    if (!this.canSubmitUpload) return;

    this.isUploading = true;
    this.fileService.uploadFilesBulk(this.uploadItems as { file: File; fileTypeId: number }[], this.selectedDepartmentIds)
      .subscribe({
        next: (response: FileResponse[]) => {
          this.isUploading = false;
          this.closeUploadModal();
          this.loadFiles();
        },
        error: (err: HttpErrorResponse) => {
          this.isUploading = false;
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
     this.closeMenu();
  this.previewModalFile = file;
  this.previewKind = this.getPreviewKind(file.extension);
  this.previewText = '';
  this.previewUrl = null;
  this.showPreviewModal = true;

  if (this.previewKind === 'unsupported') {
    return; // nothing to fetch — modal just shows a "can't preview" message + download button
  }

  this.isLoadingPreview = true;
  this.fileService.downloadFile(file.id).subscribe({
    next: (blob: Blob) => {
      this.isLoadingPreview = false;

      if (this.previewKind === 'text') {
        const reader = new FileReader();
        reader.onload = () => {
          this.previewText = reader.result as string;
        };
        reader.readAsText(blob);
        return;
      }

      // image or pdf — render via object URL
      const objectUrl = window.URL.createObjectURL(blob);
      this.previewObjectUrl = objectUrl;
      this.previewUrl = this.sanitizer.bypassSecurityTrustResourceUrl(objectUrl);
    },
    error: (err: HttpErrorResponse) => {
      this.isLoadingPreview = false;
      this.errorMessage = 'Preview failed.';
      this.showPreviewModal = false;
    }
  });
}

closePreviewModal(): void {
  this.showPreviewModal = false;
  this.previewModalFile = null;
  this.previewKind = null;
  this.previewText = '';
  this.previewUrl = null;

  if (this.previewObjectUrl) {
    window.URL.revokeObjectURL(this.previewObjectUrl);
    this.previewObjectUrl = null;
  }
}

downloadPreviewedFile(): void {
  if (this.previewModalFile) {
    this.downloadFile(this.previewModalFile);
  }
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

 
  // ---- Edit Status modal ----
  showStatusModal = false;
  statusModalFile: FileResponse | null = null;
  selectedStatus: string | null = null;
  isUpdatingStatus = false;

  readonly statusOptions: string[] = ['PENDING', 'APPROVED', 'REJECTED'];

  openStatusModal(file: FileResponse): void {
    this.statusModalFile = file;
    this.selectedStatus = file.status;
    this.showStatusModal = true;
    this.closeMenu();
  }

  closeStatusModal(): void {
    if (this.isUpdatingStatus) return;
    this.showStatusModal = false;
    this.statusModalFile = null;
    this.selectedStatus = null;
  }

  get canConfirmStatus(): boolean {
    return !!this.statusModalFile &&
      !!this.selectedStatus &&
      this.selectedStatus !== this.statusModalFile.status &&
      !this.isUpdatingStatus;
  }

  confirmStatusUpdate(): void {
    if (!this.canConfirmStatus) return;

    this.isUpdatingStatus = true;
    this.fileService.updateFileStatus(this.statusModalFile!.id, this.selectedStatus!).subscribe({
      next: () => {
        this.isUpdatingStatus = false;
        this.showStatusModal = false;
        this.statusModalFile = null;
        this.selectedStatus = null;
        this.loadFiles();
      },
      error: (err: HttpErrorResponse) => {
        this.isUpdatingStatus = false;
        this.errorMessage = 'Status update failed.';
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

  get selectedCount(): number {
  return this.selectedFileIds.size;
}

get hasSelection(): boolean {
  return this.selectedCount > 0;
}

deleteSelectedFiles(): void {

  if (this.selectedFileIds.size === 0) {
    return;
  }

  if (!confirm(`Delete ${this.selectedCount} selected file(s)?`)) {
    return;
  }

  const ids = [...this.selectedFileIds];

  ids.forEach(id => {
    this.fileService.deleteFile(id).subscribe({
      next: () => {
        this.selectedFileIds.delete(id);

        if (this.selectedFileIds.size === 0) {
          this.loadFiles();
        }
      }
    });
  });
}

downloadSelectedFiles(): void {
  if (this.selectedFileIds.size === 0) return;

  const ids = [...this.selectedFileIds];

  this.fileService.downloadFilesBulk(ids).subscribe({
    next: (blob: Blob) => {
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'files.zip';
      a.click();
      window.URL.revokeObjectURL(url);
    },
    error: (err: HttpErrorResponse) => {
      console.error('Bulk download failed:', err.status, err.error);
      this.errorMessage = 'Download failed. Please try again.';
    }
  });
}

// ---- Preview modal ----
showPreviewModal = false;
previewModalFile: FileResponse | null = null;
previewKind: 'image' | 'pdf' | 'text' | 'unsupported' | null = null;
previewUrl: SafeResourceUrl | null = null;
previewText = '';
isLoadingPreview = false;
private previewObjectUrl: string | null = null; // raw URL, kept to revoke later

readonly imageExtensions = ['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg', 'bmp'];
readonly textExtensions = ['txt', 'csv', 'json', 'md', 'log', 'xml', 'yml', 'yaml'];

private getPreviewKind(extension: string): 'image' | 'pdf' | 'text' | 'unsupported' {
  const ext = extension.toLowerCase();
  if (this.imageExtensions.includes(ext)) return 'image';
  if (ext === 'pdf') return 'pdf';
  if (this.textExtensions.includes(ext)) return 'text';
  return 'unsupported';
}

}