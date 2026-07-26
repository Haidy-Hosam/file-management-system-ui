import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { UserService, UserResponse, RegisterRequest, UpdateUserRequest } from '../../core/services/user.service';

@Component({
  selector: 'app-users',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './users.html',
  styleUrl: './users.css'
})
export class Users implements OnInit {
  allUsers: UserResponse[] = [];
  filteredUsers: UserResponse[] = [];
  isLoading = true;
  errorMessage = '';

  searchTerm = '';
  formUsername = '';
  roleFilter = '';
  openMenuUserId: number | null = null;

  constructor(private userService: UserService) {}

  ngOnInit(): void {
    this.loadUsers();
  }

  loadUsers(): void {
    this.isLoading = true;
    this.userService.getAllUsers().subscribe({
      next: (users: UserResponse[]) => {
        this.allUsers = users;
        this.applyFilters();
        this.isLoading = false;
      },
      error: (err: HttpErrorResponse) => {
        this.errorMessage = 'Failed to load users.';
        this.isLoading = false;
      }
    });
  }

  applyFilters(): void {
    let result = [...this.allUsers];

    if (this.roleFilter) {
      result = result.filter(u => u.role === this.roleFilter);
    }

    if (this.searchTerm.trim()) {
      const term = this.searchTerm.toLowerCase();
      result = result.filter(u =>
        u.name.toLowerCase().includes(term) ||
        u.email.toLowerCase().includes(term)
      );
    }

    this.filteredUsers = result;
  }

  onSearchChange(): void {
    this.applyFilters();
  }

  onRoleFilterChange(role: string): void {
    this.roleFilter = role;
    this.applyFilters();
  }

  get uniqueRoles(): string[] {
    return [...new Set(this.allUsers.map(u => u.role))];
  }

  toggleMenu(userId: number, event: Event): void {
    event.stopPropagation();
    this.openMenuUserId = this.openMenuUserId === userId ? null : userId;
  }

  closeMenu(): void {
    this.openMenuUserId = null;
  }

  getInitials(name: string): string {
    return name
      .split(' ')
      .map(part => part.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  }

  getAvatarColor(name: string): string {
    const colors = ['#2563eb', '#7c3aed', '#0891b2', '#4b5563', '#0d9488', '#9333ea'];
    const index = name.charCodeAt(0) % colors.length;
    return colors[index];
  }

  deleteUser(user: UserResponse): void {
    if (!confirm(`Delete user "${user.name}"? This cannot be undone.`)) return;

    this.userService.deleteUser(user.u_id).subscribe({
      next: () => this.loadUsers(),
      error: (err: HttpErrorResponse) => {
        this.errorMessage = 'Delete failed. You may not have permission.';
        console.error('Delete failed:', err.status, err.error);
      }
    });
    this.closeMenu();
  }

  toggleStatus(user: UserResponse): void {
    this.userService.toggleStatus(user.u_id).subscribe({
      next: () => this.loadUsers(),
      error: (err: HttpErrorResponse) => {
        this.errorMessage = 'Status update failed.';
        console.error('Status toggle failed:', err.status, err.error);
      }
    });
    this.closeMenu();
  }

  // ---- View modal ----
  showViewModal = false;
  viewUser: UserResponse | null = null;

  openViewModal(user: UserResponse): void {
    this.viewUser = user;
    this.showViewModal = true;
    this.closeMenu();
  }

  closeViewModal(): void {
    this.showViewModal = false;
    this.viewUser = null;
  }

  // ---- Add/Edit modal ----
  showModal = false;
  isEditMode = false;
  modalUser: UserResponse | null = null;

  formName = '';
  formEmail = '';
  formPassword = '';
  formRoleId: number | null = null;
  formDepartmentId: number | null = null;

  openAddModal(): void {
    this.isEditMode = false;
    this.resetForm();
    this.showModal = true;
  }

  closeModal(): void {
    this.showModal = false;
    this.resetForm();
  }

  openEditModal(user: UserResponse): void {
    this.isEditMode = true;
    this.modalUser = user;
    this.formName = user.name;
    this.formUsername = (user as any).username ?? '';
    this.formEmail = user.email;
    this.showModal = true;
    this.closeMenu();
  }

  resetForm(): void {
    this.formName = '';
    this.formUsername = '';
    this.formEmail = '';
    this.formPassword = '';
    this.formRoleId = null;
    this.formDepartmentId = null;
    this.modalUser = null;
  }

  submitForm(): void {
    if (this.isEditMode && this.modalUser) {
      const request: UpdateUserRequest = {
        name: this.formName,
        username: this.formUsername,
        email: this.formEmail,
        roleId: this.formRoleId!,
        departmentId: this.formDepartmentId!
      };
      this.userService.updateUser(this.modalUser.u_id, request).subscribe({
        next: () => { this.closeModal(); this.loadUsers(); },
        error: (err: HttpErrorResponse) => {
          this.errorMessage = 'Update failed.';
          console.error('Update failed:', err.status, err.error);
        }
      });
    } else {
      const request: RegisterRequest = {
        name: this.formName,
        username: this.formUsername,
        email: this.formEmail,
        password: this.formPassword,
        roleId: this.formRoleId!,
        departmentId: this.formDepartmentId!
      };
      this.userService.createUser(request).subscribe({
        next: () => { this.closeModal(); this.loadUsers(); },
        error: (err: HttpErrorResponse) => {
          this.errorMessage = 'Create failed.';
          console.error('Create failed:', err.status, err.error);
        }
      });
    }
  }
}