import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Department, CreateDepartmentRequest } from '../../core/models/department.model';
import { DepartmentService } from '../../core/services/department.service';
import { RouterLink } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { PermissionsService } from '../../core/services/permissions.service';
import {HasPermissionDirective} from '../../core/directives/has-permission.directive'
import { BackButton } from "../../core/back-button/back-button";



@Component({
  selector: 'app-departments',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, TranslatePipe, HasPermissionDirective, BackButton],
  templateUrl: './departments.html',
  styleUrl: './departments.css',
})
export class Departments implements OnInit {
  departments: Department[] = [];
  filteredDepartments: Department[] = [];
  isLoading = true;
  errorMessage: string | null = null;

  searchTerm = '';

  // Create-department modal state
  isModalOpen = false;
  isSaving = false;
  createError: string | null = null;
  newDepartment: CreateDepartmentRequest = { name: '', isActive: true };

  constructor(private departmentService: DepartmentService, private perms: PermissionsService   
) {}

  ngOnInit(): void {
    this.loadDepartments();
  }

  loadDepartments(): void {
    this.isLoading = true;
    this.departmentService.getAllDepartments().subscribe({
      next: (data) => {
        this.departments = data;
        this.applyFilter();
        this.isLoading = false;
      },
      error: (err) => {
        this.errorMessage = 'Failed to load departments';
        this.isLoading = false;
        console.error(err);
      },
    });
  }

  onSearchChange(): void {
    this.applyFilter();
  }

  private applyFilter(): void {
    const term = this.searchTerm.trim().toLowerCase();
    this.filteredDepartments = !term
      ? this.departments
      : this.departments.filter(d =>
          d.name.toLowerCase().includes(term) || d.head.toLowerCase().includes(term)
        );
  }

  openModal(): void {
    this.newDepartment = { name: '', isActive: true };
    this.createError = null;
    this.isModalOpen = true;
  }

  closeModal(): void {
    if (this.isSaving) return;
    this.isModalOpen = false;
  }

  submitDepartment(): void {
    if (!this.newDepartment.name.trim()) {
      this.createError = 'Department name is required';
      return;
    }

    this.isSaving = true;
    this.createError = null;

    this.departmentService.createDepartment(this.newDepartment).subscribe({
      next: () => {
        this.isSaving = false;
        this.isModalOpen = false;
        this.loadDepartments(); // refresh with real counts
      },
      error: (err) => {
        this.isSaving = false;
        this.createError = err?.error?.message ?? 'Failed to create department';
        console.error(err);
      },
    });
  }
}