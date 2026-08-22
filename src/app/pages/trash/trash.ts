import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { TrashService, TrashItem } from '../../core/services/trash.service';
import { TranslatePipe } from '@ngx-translate/core';
import { BackButton } from "../../core/back-button/back-button";
import { PageResponse } from '../file/models/file.model';
import { HttpErrorResponse } from '@angular/common/http';

@Component({
  selector: 'app-trash',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, TranslatePipe, BackButton],
  templateUrl: './trash.html',
  styleUrl: './trash.css',
})
export class Trash implements OnInit {

  deletedFiles !: PageResponse<TrashItem>;
  filteredFiles : PageResponse<TrashItem> = {
  content: [],
  totalPages: 0,
  totalElements: 0,
  size: 10,
  number: 0,
  first: false,
  last: false,
  // أي properties إجبارية تانية موجودة في PageResponse حطيها هنا
};;
  searchTerm = '';
  selectedIds = new Set<number>();
  errorMessage = '';

  constructor(
    private trashService: TrashService,
  ) {}
  
  page:number = 0;
  size:number = 10;
  totalPages = 0;
  totalElements = 0;

  sentLoading = false;
  sentError: string | null = null;


  loadDeletedItems(){
    this.sentLoading = true;
      this.sentError = null;
     this.trashService.listDeletedFiles(this.page,this.size).subscribe({
      next: (data) => {
        this.deletedFiles = data;
        this.filteredFiles = data;
        this.totalPages = this.deletedFiles.totalPages;
        this.totalElements = this.deletedFiles.totalElements;
        },
    error: (err: HttpErrorResponse) => {
     this.sentError = err.status === 404
        ? "You don't have permission to view this."
        : 'Could not load sent files.';
      this.sentLoading = false;
    }
    })
  }

  ngOnInit(): void {
    //  if (this.permissionsService.has('files','DELETE')) {
    //    this.router.navigate(['/files']);
    //    return;
    //  }

   this.loadDeletedItems();
  
  }

  nextPage(): void {
   
     
      if (this.page + 1 < this.totalPages) {
        this.page++;
         
         this.loadDeletedItems();
      }
    
  }

  prevPage(): void {
    if (this.page > 0) {
      this.page--;
      this.loadDeletedItems();
  
    }
  }

  applyFilter(): void {
    if (!this.searchTerm.trim()) {
      this.filteredFiles.content = [...this.deletedFiles.content];
    } else {
      const term = this.searchTerm.toLowerCase();
      this.filteredFiles.content = this.deletedFiles.content.filter(
        (f) =>
          f.name.toLowerCase().includes(term) ||
          f.fileType?.toLowerCase().includes(term) ||
          f.departmentNames?.some((d) => d.toLowerCase().includes(term))
      );
    }
    this.filteredFiles.totalElements = this.deletedFiles.totalElements;
    this.filteredFiles.totalPages = this.deletedFiles.totalPages;
  }

  onSearchChange(): void {
    this.applyFilter();
  }

  toggleSelectAll(event: Event): void {
    const checked = (event.target as HTMLInputElement).checked;
    if (checked) {
      this.filteredFiles.content.forEach((f) => this.selectedIds.add(f.id));
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
      this.filteredFiles.content.length > 0 &&
      this.filteredFiles.content.every((f) => this.selectedIds.has(f.id))
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
