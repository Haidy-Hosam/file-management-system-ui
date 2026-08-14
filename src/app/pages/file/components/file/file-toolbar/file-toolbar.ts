import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { HasPermissionDirective } from '../../../../../core/directives/has-permission.directive';

type FileTab = 'ALL' | 'PENDING' | 'APPROVED' | 'REJECTED';

@Component({
  selector: 'app-file-toolbar',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterLink,
    TranslatePipe,
    HasPermissionDirective
  ],
  templateUrl: './file-toolbar.html',
  styleUrl: './file-toolbar.css'
})
export class FileToolbar {

  @Input() searchTerm = '';

  @Input() activeTab: FileTab = 'ALL';

  @Input() showAdvancedSearch = false;

  @Input() activeAdvancedFilterCount = 0;

  @Input() trashCount = 0;


  @Output() searchChange = new EventEmitter<string>();

  @Output() tabChange = new EventEmitter<FileTab>();

  @Output() advancedSearchToggle = new EventEmitter<Event>();

  @Output() uploadClick = new EventEmitter<Event>();


  onSearchChange(): void {
    this.searchChange.emit(this.searchTerm);
  }

  setTab(tab: FileTab): void {
    this.tabChange.emit(tab);
  }

  toggleAdvancedSearch(event: Event): void {
    this.advancedSearchToggle.emit(event);
  }

  openUpload(event: Event): void {
    this.uploadClick.emit(event);
  }
}