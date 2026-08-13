import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslatePipe } from '@ngx-translate/core';

@Component({
  selector: 'app-file-filters',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    TranslatePipe
  ],
  templateUrl: './file-filters.html',
  styleUrl: './file-filters.css'
})
export class FileFilters {

  @Input() departments: any[] = [];
  @Input() uniqueOwners: string[] = [];
  @Input() statusOptions: string[] = [];
  @Input() fileTypes: any[] = [];

  @Input() isDeptFilterSelected!: (name: string) => boolean;
  @Input() isOwnerFilterSelected!: (name: string) => boolean;
  @Input() isStatusFilterSelected!: (status: string) => boolean;
  @Input() isFileTypeFilterSelected!: (name: string) => boolean;

  @Input() createdFrom = '';
  @Input() createdTo = '';
  @Input() modifiedFrom = '';
  @Input() modifiedTo = '';

  @Input() activeFilterCount = 0;


  @Output() deptFilterChange = new EventEmitter<string>();
  @Output() ownerFilterChange = new EventEmitter<string>();
  @Output() statusFilterChange = new EventEmitter<string>();
  @Output() fileTypeFilterChange = new EventEmitter<string>();

  @Output() dateFilterChange = new EventEmitter<void>();
  @Output() clearFilters = new EventEmitter<void>();


  toggleDeptFilter(name: string): void {
    this.deptFilterChange.emit(name);
  }

  toggleOwnerFilter(name: string): void {
    this.ownerFilterChange.emit(name);
  }

  toggleStatusFilter(status: string): void {
    this.statusFilterChange.emit(status);
  }

  toggleFileTypeFilter(name: string): void {
    this.fileTypeFilterChange.emit(name);
  }

  onDateChange(): void {
    this.dateFilterChange.emit();
  }

  clearAllFilters(): void {
    this.clearFilters.emit();
  }
}