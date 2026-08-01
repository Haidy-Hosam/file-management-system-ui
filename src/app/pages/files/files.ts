import { Component, OnInit, ElementRef, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { FileService, FileResponse, FileRequest } from '../../core/services/file.service';
import { AuthService } from '../../core/services/auth.service';
import { DepartmentService } from '../../core/services/department.service';
import { Department } from '../../core/models/department.model';
import { FileTypeService, FileType } from '../../core/services/filetype.service';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { TrashService } from '../../core/services/trash.service';
import { ForwardFileDialog } from '../../shared/forward-file-dialog/forward-file-dialog'; 
import { TranslatePipe } from '@ngx-translate/core';
import {HasPermissionDirective} from '../../core/directives/has-permission.directive'
import { FileSearchRequest } from '../../core/models/file-search-request.model';
import { PermissionsService } from '../../core/services/permissions.service';
import { Subject } from 'rxjs';
import { switchMap } from 'rxjs/operators';

interface AdvancedFilters {
  departments: Set<string>;
  owners: Set<string>;
  statuses: Set<string>;
  fileTypeNames: Set<string>;
  createdFrom: string;
  createdTo: string;
  modifiedFrom: string;
  modifiedTo: string;
}

@Component({
  selector: 'app-files',
  standalone: true,
  imports: [CommonModule, FormsModule, ForwardFileDialog, TranslatePipe,HasPermissionDirective],
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
    private elementRef: ElementRef,
    private perms: PermissionsService   

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

  // Maps the UI's sort field to the backend/entity property name used by
  // Spring Data's Pageable `sort` param. Adjust the right-hand values if
  // your entity's field names differ from the DTO's.
  private readonly sortFieldMap: Record<'NAME' | 'OWNER' | 'SIZE' | 'CREATED' | 'MODIFIED', string> = {
    NAME: 'name',
    OWNER: 'ownerName',
    SIZE: 'size',
    CREATED: 'createdDate',
    MODIFIED: 'modifiedDate'
  };

  // ---- Advanced Search ----
  showAdvancedSearch = false;
  advancedFilters: AdvancedFilters = {
    departments: new Set<string>(),
    owners: new Set<string>(),
    statuses: new Set<string>(),
    fileTypeNames: new Set<string>(),
    createdFrom: '',
    createdTo: '',
    modifiedFrom: '',
    modifiedTo: ''
  };

  selectedFileIds = new Set<number>();
  openMenuFileId: number | null = null;
  openGroupMenuId: string | null = null;

  private searchTrigger$ = new Subject<void>();


  ngOnInit(): void {
      this.searchTrigger$.pipe(
    switchMap(() => {
      this.isLoading = true;
      this.errorMessage = '';
      return this.fileService.searchFiles(this.buildSearchRequest());
    })
  ).subscribe({
    next: (response) => {
      this.allFiles = response.content;
      this.filteredFiles = response.content;
      this.totalElements = response.totalElements;
      this.totalDisplayedPages = response.totalPages;
      this.isLoading = false;
    },
    error: () => {
      this.errorMessage = 'Failed to load files.';
      this.isLoading = false;
    }
  }); 
  this.departmentService.getLookupDepartments().subscribe({
   next: (depts) => {
    this.departments = this.canFilterAllDepartments
      ? depts
      : depts.filter(d => Number(d.id) === this.authService.getDeptId());
    this.loadFiles();
    this.loadFilterOptions();
  },
    error: () => {
      this.errorMessage = 'Failed to load departments.';
      this.loadFiles();      
    }
  });

  this.loadFileTypes();

  this.route.queryParams.subscribe(params => {
    const previewId = params['previewFileId'];
    if (previewId) {
      this.previewFileById(Number(previewId));
    }
  });
}

get canFilterAllDepartments(): boolean {
  return this.perms.has('Files', 'READ_ALL');
}

  previewFileById(fileId: number): void {
    this.fileService.getFileData(fileId).subscribe({
      next: (file: FileResponse) => this.previewFile(file),
      error: () => this.errorMessage = 'Could not load that file — it may have been removed.'
    });
  }

  departments: Department[] = [];
  fileTypes: FileType[] = [];
  availableOwners: string[] = [];

private loadFilterOptions(): void {
   const req: FileSearchRequest = {
    page: 0,
    size: 1000
  };
  this.fileService.searchFiles(req).subscribe({
    next: (res) => {
      this.availableOwners = [...new Set(res.content.map(f => f.ownerName).filter(Boolean))].sort();
    }
  });
}

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
  this.searchTrigger$.next();
}

applyFilters(): void {
  this.page = 0;
  this.loadFiles();
}

private searchDebounceTimer: any;

onSearchChange(): void {
  clearTimeout(this.searchDebounceTimer);
  this.searchDebounceTimer = setTimeout(() => this.applyFilters(), 300);
}


  setTab(tab: 'ALL' | 'PENDING' | 'APPROVED' | 'REJECTED'): void {
    this.activeTab = tab;
    this.applyFilters();
  }

  // ---- Advanced Search interactions ----
  toggleAdvancedSearch(event: Event): void {
    event.stopPropagation();
    this.showAdvancedSearch = !this.showAdvancedSearch;
  }

 get uniqueOwners(): string[] {
  return this.availableOwners;
}

  isDeptFilterSelected(deptName: string): boolean {
    return this.advancedFilters.departments.has(deptName);
  }
  toggleDeptFilter(deptName: string): void {
    this.toggleSetValue(this.advancedFilters.departments, deptName);
  }

  isOwnerFilterSelected(owner: string): boolean {
    return this.advancedFilters.owners.has(owner);
  }
  toggleOwnerFilter(owner: string): void {
    this.toggleSetValue(this.advancedFilters.owners, owner);
  }

  isStatusFilterSelected(status: string): boolean {
    return this.advancedFilters.statuses.has(status);
  }
  toggleStatusFilter(status: string): void {
    this.toggleSetValue(this.advancedFilters.statuses, status);
  }

 isFileTypeFilterSelected(typeName: string): boolean {
  return this.advancedFilters.fileTypeNames.has(typeName);
}

toggleFileTypeFilter(typeName: string): void {
  this.toggleSetValue(this.advancedFilters.fileTypeNames, typeName);
}

  private toggleSetValue(set: Set<string>, value: string): void {
    if (set.has(value)) {
      set.delete(value);
    } else {
      set.add(value);
    }
    this.applyFilters();
  }

  get activeAdvancedFilterCount(): number {
    const f = this.advancedFilters;
    let count = f.departments.size + f.owners.size + f.statuses.size + f.fileTypeNames.size;
    if (f.createdFrom) count++;
    if (f.createdTo) count++;
    if (f.modifiedFrom) count++;
    if (f.modifiedTo) count++;
    return count;
  }

  clearAdvancedFilters(): void {
    this.advancedFilters = {
      departments: new Set<string>(),
      owners: new Set<string>(),
      statuses: new Set<string>(),
      fileTypeNames: new Set<string>(),
      createdFrom: '',
      createdTo: '',
      modifiedFrom: '',
      modifiedTo: ''
    };
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
    this.showAdvancedSearch = false;
  }

  setSort(field: 'NAME' | 'OWNER' | 'SIZE' | 'CREATED' | 'MODIFIED'): void {
    if (this.sortBy === field) {
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortBy = field;
      this.sortDirection = 'asc';
    }
    // Sorting spans the whole dataset, so go back to page 0 and re-fetch
    // from the backend with the new sort applied, rather than re-sorting
    // just the rows already on screen.
    this.page = 0;
    this.loadFiles();
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

getFileIcon(extension: string): string {
  const map: Record<string, string> = {
     pdf: 'bi-file-earmark-pdf',
    docx: 'bi-file-earmark-word',
    doc: 'bi-file-earmark-word',
    xlsx: 'bi-file-earmark-excel',
    xls: 'bi-file-earmark-excel',
    zip: 'bi-file-earmark-zip',
    gz: 'bi-file-earmark-zip',
    png: 'bi-file-earmark-image',
    jpg: 'bi-file-earmark-image',
    jpeg: 'bi-file-earmark-image',
    txt: 'bi-file-earmark-text'
  };

  return map[extension.toLowerCase()] ?? 'bi-file-earmark';
}
getFileIconColor(extension: string): string {
  const map: Record<string, string> = {
    pdf: '#ef4444',
    docx: '#2563eb',
    doc: '#2563eb',
    xlsx: '#16a34a',
    xls: '#16a34a',
    zip: '#f59e0b',
    gz: '#f59e0b',
    png: '#10b981',
    jpg: '#10b981',
    jpeg: '#10b981',
    txt: '#64748b'
  };

  return map[extension?.toLowerCase()] ?? '#64748b';
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

  private getScopedDepartments(selected: Set<string>): string[] | undefined {
  const canViewAllDepartments = this.perms.has('Files', 'DELETE');

  if (!canViewAllDepartments) {
    const deptId = this.authService.getDeptId();
    const deptName = deptId != null ? this.getDepartmentName(deptId) : null;
    return deptName ? [deptName] : undefined;
  }

  return selected.size > 0 ? [...selected] : undefined;
}

private buildSearchRequest(): FileSearchRequest {
  const f = this.advancedFilters;

  const statuses = this.activeTab !== 'ALL'
    ? [this.activeTab]
    : (f.statuses.size > 0 ? [...f.statuses] : undefined);

  const backendSortField = this.sortBy ? this.sortFieldMap[this.sortBy] : undefined;

  return {
    name: this.searchTerm.trim() || undefined,
    owners: f.owners.size > 0 ? [...f.owners] : undefined,
    departments: f.departments.size > 0 ? [...f.departments] : undefined,
    categories: f.fileTypeNames.size > 0 ? [...f.fileTypeNames] : undefined,
    statuses,
    fromDate: f.createdFrom || undefined,
    toDate: f.createdTo || undefined,
    modifiedFrom: f.modifiedFrom || undefined,
    modifiedTo: f.modifiedTo || undefined,
    sortBy: backendSortField,
    sortDir: this.sortDirection,
    page: this.page,
    size: this.size
  };
}
}