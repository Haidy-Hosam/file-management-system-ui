import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslatePipe } from '@ngx-translate/core';
import { SecuritylevelService } from '../../core/services/securitylevel.service';
import { SecurityLevel } from '../../core/models/SecurityLevel.model';
import { BackButton } from "../../core/back-button/back-button";

@Component({
  selector: 'app-security-levels',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslatePipe, BackButton],
  templateUrl: './security-levels.html',
  styleUrl: './security-levels.css',
})
export class SecurityLevelsComponent implements OnInit {
  levels = signal<SecurityLevel[]>([]);
  isLoading = signal(true);
  errorMessage = signal('');
  successMessage = signal('');

  // Create modal
  showCreateModal = false;
  createName = '';
  isSaving = false;

  // Edit modal
  showEditModal = false;
  editId: number | null = null;
  editName = '';
  isUpdating = false;

  // Delete modal
  showDeleteModal = false;
  deleteTarget: SecurityLevel | null = null;
  isDeleting = false;

  constructor(private securityLevelService: SecuritylevelService) {}

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.isLoading.set(true);
    this.errorMessage.set('');
    this.securityLevelService.getSecurityLevels().subscribe({
      next: (data) => {
        this.levels.set(data);
        this.isLoading.set(false);
      },
      error: () => {
        this.errorMessage.set('SECURITY_LEVELS.FAILED_LOAD');
        this.isLoading.set(false);
      },
    });
  }

  // ── Create ──────────────────────────────────────────────
  openCreateModal(): void {
    this.createName = '';
    this.showCreateModal = true;
  }

  closeCreateModal(): void {
    this.showCreateModal = false;
    this.createName = '';
  }

  submitCreate(): void {
    const name = this.createName.trim();
    if (!name) return;
    this.isSaving = true;
    this.securityLevelService.createSecurityLevel(name).subscribe({
      next: (created) => {
        this.levels.update(list => [...list, created]);
        this.isSaving = false;
        this.closeCreateModal();
        this.flash('success');
      },
      error: () => {
        this.isSaving = false;
        this.errorMessage.set('SECURITY_LEVELS.FAILED_CREATE');
      },
    });
  }

  // ── Edit ────────────────────────────────────────────────
  openEditModal(level: SecurityLevel): void {
    this.editId = level.id;
    this.editName = level.name;
    this.showEditModal = true;
  }

  closeEditModal(): void {
    this.showEditModal = false;
    this.editId = null;
    this.editName = '';
  }

  submitEdit(): void {
    const name = this.editName.trim();
    if (!name || this.editId === null) return;
    this.isUpdating = true;
    this.securityLevelService.updateSecurityLevel(this.editId, name).subscribe({
      next: (updated) => {
        this.levels.update(list =>
          list.map(l => (l.id === updated.id ? updated : l))
        );
        this.isUpdating = false;
        this.closeEditModal();
        this.flash('success');
      },
      error: () => {
        this.isUpdating = false;
        this.errorMessage.set('SECURITY_LEVELS.FAILED_UPDATE');
      },
    });
  }

  // ── Delete ──────────────────────────────────────────────
  openDeleteModal(level: SecurityLevel): void {
    this.deleteTarget = level;
    this.showDeleteModal = true;
  }

  closeDeleteModal(): void {
    this.showDeleteModal = false;
    this.deleteTarget = null;
  }

  confirmDelete(): void {
    if (!this.deleteTarget) return;
    this.isDeleting = true;
    this.securityLevelService.deleteSecurityLevel(this.deleteTarget.id).subscribe({
      next: () => {
        const deletedId = this.deleteTarget!.id;
        this.levels.update(list => list.filter(l => l.id !== deletedId));
        this.isDeleting = false;
        this.closeDeleteModal();
        this.flash('success');
      },
      error: () => {
        this.isDeleting = false;
        this.errorMessage.set('SECURITY_LEVELS.FAILED_DELETE');
      },
    });
  }

  // ── Helpers ─────────────────────────────────────────────
  private flash(type: 'success'): void {
    this.successMessage.set('SECURITY_LEVELS.SUCCESS');
    setTimeout(() => this.successMessage.set(''), 3000);
  }

  dismissError(): void {
    this.errorMessage.set('');
  }
}
