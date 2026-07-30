import { Component, OnInit, ElementRef, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router'; // add ActivatedRoute here
import { HttpErrorResponse } from '@angular/common/http';
import { FileService, FileResponse, FileRequest } from '../../core/services/file.service';
import { AuthService } from '../../core/services/auth.service';
import { DepartmentService } from '../../core/services/department.service';
import { Department } from '../../core/models/department.model';
import { FileTypeService, FileType } from '../../core/services/filetype.service';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { TrashService } from '../../core/services/trash.service';
import { ForwardFileDialog } from '../../shared/forward-file-dialog/forward-file-dialog'; // adjust path
import { TranslatePipe } from '@ngx-translate/core';

@Component({
  selector: 'app-files',
  standalone: true,
  imports: [CommonModule, FormsModule, ForwardFileDialog, TranslatePipe],
  templateUrl: './files.html',
  styleUrl: './files.css'
})
export class Files implements OnInit {
  allFiles: FileResponse[] = [];
  filteredFiles: FileResponse[] = [];
  isLoading = true;
  errorMessage = '';

  constructor(
    private fileService: FileService,
    private authService: AuthService,
    private departmentService: DepartmentService,
    private fileTypeService: FileTypeService,
    private trashService: TrashService,
    private router: Router,
    private route: ActivatedRoute,
    private sanitizer: DomSanitizer,
    private elementRef: ElementRef
  ) { }

  get isAdmin(): boolean {
    return this.authService.getRole() === 'ADMIN';
  }

  get trashCount(): number {
    return this.trashService.trashCount;
  }

  // Backend pagination parameters
  page = 0;
  size = 10;

  totalDisplayedPages = 0;
  totalElements = 0;

  searchTerm = '';
  activeTab: 'ALL' | 'PENDING' | 'APPROVED' | 'REJECTED' = 'ALL';
  sortBy: 'NAME' | 'OWNER' | 'SIZE' | 'CREATED' | 'MODIFIED' | null = null;  
  sortDirection: 'asc' | 'desc' = 'asc';
  // showSortMenu = false;
  showFilterMenu = false;

  selectedFileIds = new Set<number>();
  openMenuFileId: number | null = null;
  openGroupMenuId: string | null = null;

  ngOnInit(): void {
    this.loadFiles();
    this.loadDepartments();
    this.loadFileTypes();

    this.route.queryParams.subscribe(params => {
      const previewId = params['previewFileId'];
      if (previewId) {
        this.previewFileById(Number(previewId));
      }
    });
  }

  previewFileById(fileId: number): void {
    this.fileService.getFileData(fileId).subscribe({
      next: (file: FileResponse) => this.previewFile(file),
      error: () => this.errorMessage = 'Could not load that file — it may have been removed.'
    });
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

  loadFiles() {
    this.isLoading = true;
    const role = this.authService.getRole();

    // ADMIN sees everything; MANAGER/EMPLOYEE are restricted to their own
    // department, per the controller's @PreAuthorize check on /dept/{deptId}.
    let request$;
    if (role === 'ADMIN') {
      request$ = this.fileService.getAllFiles(this.page, this.size);
    } else {
      const deptId = this.authService.getDeptId();
      if (deptId == null) {
        this.errorMessage = 'No department found for current user.';
        this.isLoading = false;
        return;
      }
      request$ = this.fileService.getAllFilesByDepartment(deptId, this.page, this.size);
    }

    request$.subscribe({
      next: (response) => {
        this.allFiles = response.content;

        this.totalElements = response.totalElements;
        this.totalDisplayedPages = response.totalPages;
        this.applyFilters();

        this.isLoading = false;
      },
      error: (err: HttpErrorResponse) => {
        this.errorMessage = 'Failed to load files.';
        this.isLoading = false;
      }
    })
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

    if (this.sortBy) {
      result = this.sortFiles(result);
    }

    this.filteredFiles = result;
  }

  setTab(tab: 'ALL' | 'PENDING' | 'APPROVED' | 'REJECTED'): void {
    this.activeTab = tab;
    this.showFilterMenu = false;
    this.applyFilters();
  }

  onSearchChange(): void {
    this.applyFilters();
  }

  nextPage(): void {
    if (this.page < this.totalDisplayedPages - 1) {
      this.page++;
      this.loadFiles();
    }
  }
  previousPage(): void {
    if (this.page > 0) {
      this.page--;
      this.loadFiles();
    }
  }
  goToPage(page: number): void {
    this.page = page;
    this.loadFiles();
  }

  toggleSelectAll(event: Event): void {
    const checked = (event.target as HTMLInputElement).checked;
    if (checked) {
      this.filteredFiles.forEach(f => this.selectedFileIds.add(f.id));
    } else {
      this.filteredFiles.forEach(f => this.selectedFileIds.delete(f.id));
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
  this.showFilterMenu = false;
}

  // toggleSortMenu(event: Event): void {
  //   event.stopPropagation();
  //   this.showSortMenu = !this.showSortMenu;
  //   this.showFilterMenu = false;
  // }

toggleFilterMenu(event: Event): void {
  event.stopPropagation();
  this.showFilterMenu = !this.showFilterMenu;
}

setSort(field: 'NAME' | 'OWNER' | 'SIZE' | 'CREATED' | 'MODIFIED'): void {
  if (this.sortBy === field) {
    this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
  } else {
    this.sortBy = field;
    this.sortDirection = 'asc';
  }
  this.applyFilters();
}

  private sortFiles(files: FileResponse[]): FileResponse[] {
  const dir = this.sortDirection === 'asc' ? 1 : -1;
  return [...files].sort((a, b) => {
    switch (this.sortBy) {
      case 'NAME':
        return a.name.localeCompare(b.name) * dir;
      case 'OWNER':
        return a.ownerName.localeCompare(b.ownerName) * dir;
      case 'SIZE':
        return (this.parseSize(a.size) - this.parseSize(b.size)) * dir;
      case 'CREATED':
        return (new Date(a.createdDate).getTime() - new Date(b.createdDate).getTime()) * dir;
      case 'MODIFIED':
        return (new Date(a.modifiedDate).getTime() - new Date(b.modifiedDate).getTime()) * dir;
      default:
        return 0;
    }
  });
}
  private parseSize(size: string | number): number {
    if (typeof size === 'number') return size;
    const match = size.match(/([\d.]+)\s*(KB|MB|GB)?/i);
    if (!match) return 0;
    const value = parseFloat(match[1]);
    const unit = (match[2] || '').toUpperCase();
    const multipliers: Record<string, number> = { KB: 1024, MB: 1024 ** 2, GB: 1024 ** 3 };
    return value * (multipliers[unit] || 1);
  }

@HostListener('document:click', ['$event'])
onDocumentClick(event: MouseEvent): void {
  if (this.elementRef.nativeElement.contains(event.target)) return;
  this.closeMenu();
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

  toggleDepartmentSelection(deptId: number | string): void {
    const numId = Number(deptId);
    const idx = this.selectedDepartmentIds.indexOf(numId);
    if (idx > -1) {
      this.selectedDepartmentIds.splice(idx, 1);
    } else {
      this.selectedDepartmentIds.push(numId);
    }
  }

  isDepartmentSelected(deptId: number | string): boolean {
    return this.selectedDepartmentIds.includes(Number(deptId));
  }

  getDepartmentName(deptId: number | string): string {
    const numId = Number(deptId);
    return this.departments.find(d => Number(d.id) === numId)?.name ?? 'Unknown';
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
    if (!confirm(`Delete "${file.name}"?`)) return;

    const rejectedFile: FileResponse = { ...file, status: 'REJECTED' };
    this.trashService.moveToTrash(rejectedFile);

    this.fileService.updateFileStatus(file.id, 'REJECTED').subscribe({
      next: () => {
        this.fileService.deleteFile(file.id).subscribe({
          next: () => this.loadFiles(),
          error: () => this.loadFiles(),
        });
      },
      error: () => {
        this.fileService.deleteFile(file.id).subscribe({
          next: () => this.loadFiles(),
          error: () => this.loadFiles(),
        });
      },
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
    const filesToTrash = this.allFiles.filter(f => ids.includes(f.id));
    if (filesToTrash.length > 0) {
      this.trashService.moveToTrashBulk(filesToTrash);
    }

    ids.forEach(id => {
      this.fileService.deleteFile(id).subscribe({
        next: () => {
          this.selectedFileIds.delete(id);

          if (this.selectedFileIds.size === 0) {
            this.loadFiles();
          }
        },
        error: () => {
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

  onForward(file: FileResponse): void {
    this.forwardingFileId = file.id;
    this.closeMenu();
  }
  forwardingFileId: number | null = null;

  onForwardDialogClosed(): void {
    this.forwardingFileId = null;
  }

  onForwardSuccess(): void {
    this.forwardingFileId = null;
    this.loadFiles(); // optional — refresh the list after forwarding
  }
}