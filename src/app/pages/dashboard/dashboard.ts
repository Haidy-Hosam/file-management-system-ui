import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { FileService, FileResponse } from '../file/services/file.service';
import { DepartmentService } from '../../core/services/department.service';
import { Department } from '../../core/models/department.model';
import { TrashService } from '../../core/services/trash.service';
import { AuthService } from '../../core/services/auth.service';
import { DashboardService } from '../../core/services/dashboard.service';
import { DashboardStatistics } from '../../core/models/DashboardStatistics';
import { TranslatePipe } from '@ngx-translate/core';

interface MonthlyActivity {
  month: string;
  filesCount: number;
  heightPercent: number;
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, TranslatePipe],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css',
})
export class Dashboard implements OnInit {
  Math = Math;
  isLoading = true;
  userEmail = '';
  userRole = '';
  greetingKey = 'DASHBOARD.GOOD_MORNING';

  statistics: DashboardStatistics | null = null;

  totalFiles = 0;
  pendingCount = 0;
  approvedCount = 0;
  rejectedCount = 0;

  totalDepartments = 0;
  totalStorageUsed = '0 KB';
  trashCount = 0;

  recentFiles: FileResponse[] = [];
  departmentsList: Department[] = [];
  selectedPeriod: 'TODAY' | 'WEEK' | 'MONTH' | 'ALL' = 'MONTH';

  // Monthly activity trend
  monthlyTrends: MonthlyActivity[] = [
    { month: 'Feb', filesCount: 14, heightPercent: 35 },
    { month: 'Mar', filesCount: 22, heightPercent: 55 },
    { month: 'Apr', filesCount: 18, heightPercent: 45 },
    { month: 'May', filesCount: 35, heightPercent: 85 },
    { month: 'Jun', filesCount: 28, heightPercent: 70 },
    { month: 'Jul', filesCount: 42, heightPercent: 100 },
  ];

  constructor(
    private fileService: FileService,
    private departmentService: DepartmentService,
    private trashService: TrashService,
    private authService: AuthService,
    private dashboardService: DashboardService
  ) {}

  ngOnInit(): void {
    this.userEmail = this.authService.getDecodedToken()?.sub ?? 'User';
    this.userRole = this.authService.getRole() ?? 'USER';
    this.greetingKey = this.computeGreeting();
    this.loadDashboardData();
    this.getStatistics();
  }

  getStatistics(): void {
    this.dashboardService.getStatistics().subscribe({
      next: (response) => {
        this.statistics = response;
        this.totalFiles = response.totalDocuments;
        this.pendingCount = response.pendingReviews;
        this.approvedCount = response.approvedArchives;
        this.rejectedCount =
          (response as any).rejectedCount ??
          (response as any).rejectedDocuments ??
          Math.max(0, response.totalDocuments - (response.approvedArchives + response.pendingReviews));
        this.totalDepartments = response.activeDepartments;
      },
      error: (error) => {
        console.error(error);
      },
    });
  }

  private computeGreeting(): string {
    const hour = new Date().getHours();
    if (hour < 12) return 'DASHBOARD.GOOD_MORNING';
    if (hour < 18) return 'DASHBOARD.GOOD_AFTERNOON';
    return 'DASHBOARD.GOOD_EVENING';
  }

  loadDashboardData(): void {
  this.isLoading = true;
  this.trashCount = this.trashService.trashCount;

  // CHANGED: getAllFiles(0, 50) → listFiles(0, 50)
  this.fileService.listFiles(0, 50).subscribe({
    next: (res) => {
      const files = res.content || [];
      this.recentFiles = files.slice(0, 6);
      this.isLoading = false;
    },
    error: () => {
      this.isLoading = false;
    },
  });

  this.departmentService.getAllDepartments().subscribe({
    next: (depts) => {
      this.departmentsList = depts;
    },
    error: () => {},
  });
}

  setPeriod(period: 'TODAY' | 'WEEK' | 'MONTH' | 'ALL'): void {
    this.selectedPeriod = period;
    // Visually adjust statistics based on selected period multiplier
    const factor = period === 'TODAY' ? 0.2 : period === 'WEEK' ? 0.5 : period === 'MONTH' ? 0.8 : 1;
    this.monthlyTrends = this.monthlyTrends.map((t) => ({
      ...t,
      heightPercent: Math.min(100, Math.round(t.heightPercent * factor + 15)),
    }));
  }

  // Donut chart calculations
  get approvedPercent(): number {
    if (this.totalFiles === 0) return 0;
    return Math.round((this.approvedCount / this.totalFiles) * 100);
  }

  get pendingPercent(): number {
    if (this.totalFiles === 0) return 0;
    return Math.round((this.pendingCount / this.totalFiles) * 100);
  }

  get rejectedPercent(): number {
    if (this.totalFiles === 0) return 0;
    return Math.round((this.rejectedCount / this.totalFiles) * 100);
  }

  get strokeDashArrayApproved(): string {
    const p = this.approvedPercent;
    return `${p} ${100 - p}`;
  }

  get strokeDashArrayPending(): string {
    const p = this.pendingPercent;
    return `${p} ${100 - p}`;
  }

  get strokeDashOffsetPending(): number {
    return -this.approvedPercent;
  }

  get strokeDashArrayRejected(): string {
    const p = this.rejectedPercent;
    return `${p} ${100 - p}`;
  }

  get strokeDashOffsetRejected(): number {
    return -(this.approvedPercent + this.pendingPercent);
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

  getStatusBadgeClass(status: string): string {
    const upper = status?.toUpperCase() || '';
    if (upper === 'APPROVED') return 'bg-success-subtle text-success border-success';
    if (upper === 'PENDING') return 'bg-warning-subtle text-warning border-warning';
    if (upper === 'REJECTED') return 'bg-danger-subtle text-danger border-danger';
    return 'bg-secondary-subtle text-secondary';
  }
}
