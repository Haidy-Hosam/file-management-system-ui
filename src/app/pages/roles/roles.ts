import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { RolesService, Role } from '../../core/services/roles.service';

@Component({
  selector: 'app-roles',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './roles.html',
  styleUrl: './roles.css',
})
export class Roles implements OnInit {
  roles: Role[] = [];
  searchTerm = '';

  isLoading = true;
  errorMessage = '';

  selectedIds = new Set<number>();

  constructor(private rolesService: RolesService) {}

  ngOnInit(): void {
    this.loadRoles();
  }

  loadRoles(): void {
    this.isLoading = true;
    this.errorMessage = '';

    this.rolesService.getAllRoles().subscribe({
      next: (roles) => {
        this.roles = roles;
        this.isLoading = false;
      },
      error: () => {
        this.errorMessage = 'Failed to load roles.';
        this.isLoading = false;
      },
    });
  }

  get filteredRoles(): Role[] {
    const term = this.searchTerm.trim().toLowerCase();
    if (!term) return this.roles;
    return this.roles.filter((r) => r.name.toLowerCase().includes(term));
  }

  get allSelected(): boolean {
    return (
      this.filteredRoles.length > 0 &&
      this.filteredRoles.every((r) => this.selectedIds.has(r.id))
    );
  }

  toggleSelectAll(): void {
    if (this.allSelected) {
      this.filteredRoles.forEach((r) => this.selectedIds.delete(r.id));
    } else {
      this.filteredRoles.forEach((r) => this.selectedIds.add(r.id));
    }
  }

  toggleSelect(role: Role): void {
    if (this.selectedIds.has(role.id)) {
      this.selectedIds.delete(role.id);
    } else {
      this.selectedIds.add(role.id);
    }
  }

  isSelected(role: Role): boolean {
    return this.selectedIds.has(role.id);
  }

  deleteRole(role: Role): void {
    if (!confirm(`Delete role "${role.name}"? This cannot be undone.`)) return;
    this.rolesService.deleteRole(role.id).subscribe({
      next: () => {
        this.roles = this.roles.filter((r) => r.id !== role.id);
        this.selectedIds.delete(role.id);
      },
      error: () => (this.errorMessage = 'Delete failed. You may not have permission.'),
    });
  }
}