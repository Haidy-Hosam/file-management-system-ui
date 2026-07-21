import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { UserService, UserResponse } from '../../core/services/user.service';

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

    this.userService.deleteUser(user.id).subscribe({
      next: () => this.loadUsers(),
      error: (err: HttpErrorResponse) => {
        this.errorMessage = 'Delete failed. You may not have permission.';
      }
    });
    this.closeMenu();
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

  openEditModal(user: UserResponse): void {
    this.isEditMode = true;
    this.modalUser = user;
    this.formName = user.name;
    this.formEmail = user.email;
    this.formPassword = '';
    this.showModal = true;
    this.closeMenu();
  }

  closeModal(): void {
    this.showModal = false;
    this.resetForm();
  }

  resetForm(): void {
    this.formName = '';
    this.formEmail = '';
    this.formPassword = '';
    this.formRoleId = null;
    this.formDepartmentId = null;
    this.modalUser = null;
  }

  submitForm(): void {
    const request = {
      name: this.formName,
      email: this.formEmail,
      password: this.formPassword,
      roleId: this.formRoleId!,
      departmentId: this.formDepartmentId!
    };

    if (this.isEditMode && this.modalUser) {
      this.userService.updateUser(this.modalUser.id, request).subscribe({
        next: () => {
          this.closeModal();
          this.loadUsers();
        },
        error: (err: HttpErrorResponse) => {
          this.errorMessage = 'Update failed.';
        }
      });
    } else {
      this.userService.createUser(request).subscribe({
        next: () => {
          this.closeModal();
          this.loadUsers();
        },
        error: (err: HttpErrorResponse) => {
          this.errorMessage = 'Create failed.';
        }
      });
    }
  }
}