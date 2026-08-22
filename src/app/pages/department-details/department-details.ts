import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { Department, DepartmentDetails, ReassignmentItem } from '../../core/models/department.model';
import { DepartmentService } from '../../core/services/department.service';
import { formatBytes } from '../../core/utils/format-bytes';
import { FormsModule } from '@angular/forms';
import { TranslatePipe } from '@ngx-translate/core';
import {HasPermissionDirective} from '../../core/directives/has-permission.directive'
import { BackButton } from "../../core/back-button/back-button";


@Component({
  selector: 'app-department-details',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslatePipe, HasPermissionDirective, BackButton],
  templateUrl: './department-details.html',
  styleUrl: './department-details.css',
})
export class DepartmentDetailsComponent implements OnInit {
  department = signal<DepartmentDetails | null>(null);
  isLoading = signal(true);
  errorMessage = signal<string | null>(null);
  storageDisplay = signal('');

  availableDepartments = signal<Department[]>([]);
  employeeAssignments = signal<Record<number, string>>({});

  isDeleteModalOpen = signal(false);
  isDeleting = signal(false);
  deleteError = signal<string | null>(null);

  isActivating = signal(false);
  activateError = signal<string | null>(null);

  // Derived — recomputes automatically whenever availableDepartments changes
  departmentsWithoutManager = computed(() =>
    this.availableDepartments().filter(d => d.head === 'Unassigned')
  );

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private departmentService: DepartmentService
  ) {}

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) {
      this.errorMessage.set('No department id provided');
      this.isLoading.set(false);
      return;
    }

    this.departmentService.getDepartmentDetails(id).subscribe({
      next: (data) => {
        this.department.set(data);
        this.storageDisplay.set(formatBytes(data.storageUsed));
        this.isLoading.set(false);
      },
      error: (err) => {
        this.errorMessage.set('Failed to load department details');
        this.isLoading.set(false);
        console.error(err);
      },
    });
  }

  goBack(): void {
    this.router.navigate(['/departments']);
  }

  formatFileSize(bytes: number | string): string {
    const num = typeof bytes === 'number' ? bytes : parseFloat(bytes) || 0;
    return formatBytes(num);
  }

  openDeleteModal(): void {
    this.deleteError.set(null);
    this.employeeAssignments.set({});

    const dept = this.department();
    if (dept && dept.employeeCount > 0) {
      this.departmentService.getAllDepartments().subscribe({
        next: (list) => {
          this.availableDepartments.set(list.filter(d => d.id !== dept.id));
          this.isDeleteModalOpen.set(true);
        },
        error: () => {
          this.deleteError.set('Failed to load departments for reassignment');
          this.isDeleteModalOpen.set(true);
        },
      });
    } else {
      this.isDeleteModalOpen.set(true); // no employees — no reassignment needed
    }
  }

  closeDeleteModal(): void {
    if (this.isDeleting()) return;
    this.isDeleteModalOpen.set(false);
  }

  setAssignment(employeeId: number, targetDepartmentId: string): void {
    this.employeeAssignments.update(current => ({ ...current, [employeeId]: targetDepartmentId }));
  }

  confirmDelete(): void {
    const dept = this.department();
    if (!dept) return;

    const employees = dept.employees ?? [];

    const stuckManager = employees.find(
      emp => emp.isManager && this.departmentsWithoutManager().length === 0
    );
    if (stuckManager) {
      this.deleteError.set(`${stuckManager.name} has no available department to move to. Resolve this before deleting.`);
      return;
    }

    const assignments = this.employeeAssignments();
    const missing = employees.some(emp => !assignments[emp.id]);
    if (missing) {
      this.deleteError.set('Please choose a department for every employee');
      return;
    }

    this.isDeleting.set(true);
    this.deleteError.set(null);

    const reassignments: ReassignmentItem[] = employees.map(emp => ({
      employeeId: emp.id,
      targetDepartmentId: Number(assignments[emp.id]),
    }));

    this.departmentService
      .deleteDepartment(String(dept.id), reassignments.length ? reassignments : undefined)
      .subscribe({
        next: () => {
          this.isDeleting.set(false);
          this.router.navigate(['/departments']);
        },
        error: (err) => {
          this.isDeleting.set(false);
          this.deleteError.set(err?.error?.message ?? 'Failed to delete department');
        },
      });
  }

  activateDepartment(): void {
    const dept = this.department();
    if (!dept) return;

    this.isActivating.set(true);
    this.activateError.set(null);

    this.departmentService.activateDepartment(String(dept.id)).subscribe({
      next: () => {
        this.isActivating.set(false);
        this.department.update(d => d ? { ...d, isActive: true } : d);
      },
      error: (err) => {
        this.isActivating.set(false);
        this.activateError.set(err?.error?.message ?? 'Failed to activate department');
      },
    });
  }
  isEditModalOpen = signal(false);
isSaving = signal(false);
editError = signal<string | null>(null);
editName = signal('');

openEditModal(): void {
  const dept = this.department();
  if (!dept) return;
  this.editName.set(dept.name);
  this.editError.set(null);
  this.isEditModalOpen.set(true);
}

closeEditModal(): void {
  if (this.isSaving()) return;
  this.isEditModalOpen.set(false);
}

setEditName(value: string): void {
  this.editName.set(value);
}

saveDepartmentName(): void {
  const dept = this.department();
  if (!dept) return;

  const trimmed = this.editName().trim();
  if (!trimmed) {
    this.editError.set('Department name is required');
    return;
  }

  this.isSaving.set(true);
  this.editError.set(null);

  this.departmentService
    .updateDepartment(String(dept.id), { name: trimmed, isActive: dept.isActive })
    .subscribe({
      next: () => {
        this.isSaving.set(false);
        this.isEditModalOpen.set(false);
        this.department.update(d => d ? { ...d, name: trimmed } : d);
      },
      error: (err) => {
        this.isSaving.set(false);
        this.editError.set(err?.error?.message ?? 'Failed to update department');
      },
    });
}
}