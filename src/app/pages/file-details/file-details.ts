import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { FileService, FileResponse } from '../../core/services/file.service';
import {
  FileDetailsService,
  FileVersion,
  FileActivity,
  FilePermission,
} from '../../core/services/file-details.service';

type TabId = 'overview' | 'versions' | 'activity' | 'permissions';

@Component({
  selector: 'app-file-details',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './file-details.html',
  styleUrl: './file-details.css',
})
export class FileDetails implements OnInit {
  fileId!: number;

  file: FileResponse | null = null;
  versions: FileVersion[] = [];
  activity: FileActivity[] = [];
  permissions: FilePermission[] = [];

  isLoading = true;
  errorMessage = '';

  activeTab: TabId = 'overview';
  tabs: { id: TabId; label: string }[] = [
    { id: 'overview', label: 'Overview' },
    { id: 'versions', label: 'Versions' },
    { id: 'activity', label: 'Activity' },
    { id: 'permissions', label: 'Permissions' },
  ];

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private fileService: FileService,
    private fileDetailsService: FileDetailsService
  ) {}

  ngOnInit(): void {
    const idParam = this.route.snapshot.paramMap.get('id');
    this.fileId = idParam ? Number(idParam) : 0;
    this.loadFile();
  }

  loadFile(): void {
    this.isLoading = true;
    this.errorMessage = '';

    this.fileService.getFileData(this.fileId).subscribe({
      next: (file) => {
        this.file = file;
        this.isLoading = false;
        this.loadTabData(this.activeTab);
      },
      error: (err: HttpErrorResponse) => {
        this.errorMessage = 'Failed to load file details.';
        this.isLoading = false;
      },
    });
  }

  setTab(tab: TabId): void {
    this.activeTab = tab;
    this.loadTabData(tab);
  }

  private loadTabData(tab: TabId): void {
    switch (tab) {
      case 'versions':
        if (this.versions.length === 0) this.loadVersions();
        break;
      case 'activity':
        if (this.activity.length === 0) this.loadActivity();
        break;
      case 'permissions':
        if (this.permissions.length === 0) this.loadPermissions();
        break;
    }
  }

  loadVersions(): void {
    this.fileDetailsService.getVersions(this.fileId).subscribe({
      next: (versions) => (this.versions = versions),
      error: () => (this.errorMessage = 'Failed to load version history.'),
    });
  }

  loadActivity(): void {
    this.fileDetailsService.getActivity(this.fileId).subscribe({
      next: (activity) => (this.activity = activity),
      error: () => (this.errorMessage = 'Failed to load activity log.'),
    });
  }

  loadPermissions(): void {
    this.fileDetailsService.getPermissions(this.fileId).subscribe({
      next: (permissions) => (this.permissions = permissions),
      error: () => (this.errorMessage = 'Failed to load permissions.'),
    });
  }

  getInitials(name: string): string {
    return name
      .split(' ')
      .map((part) => part.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  }

  getAvatarColor(name: string): string {
    const colors = ['#2563eb', '#0ea5b7', '#6b7280', '#1e293b', '#7c3aed', '#0d9488'];
    const index = name.charCodeAt(0) % colors.length;
    return colors[index];
  }

  private fileDisplayName(): string {
    if (!this.file) return 'file';
    return this.file.extension ? `${this.file.name}.${this.file.extension}` : this.file.name;
  }

  downloadFile(): void {
    this.fileService.downloadFile(this.fileId).subscribe({
      next: (blob) => this.triggerDownload(blob, this.fileDisplayName()),
      error: () => (this.errorMessage = 'Download failed.'),
    });
  }

  downloadVersion(version: FileVersion): void {
    this.fileDetailsService.downloadVersion(this.fileId, version.id).subscribe({
      next: (blob) => this.triggerDownload(blob, `${this.fileDisplayName()}-${version.version}`),
      error: () => (this.errorMessage = 'Download failed.'),
    });
  }

  private triggerDownload(blob: Blob, filename: string): void {
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    window.URL.revokeObjectURL(url);
  }

  // No dedicated archive endpoint on FileService — treated as a status update.
  archiveFile(): void {
    if (!confirm('Archive this file?')) return;
    this.fileService.updateFileStatus(this.fileId, 'Archived').subscribe({
      next: (updated) => (this.file = updated),
      error: () => (this.errorMessage = 'Archive failed.'),
    });
  }

  deleteFile(): void {
    if (!confirm(`Delete "${this.fileDisplayName()}"? This cannot be undone.`)) return;
    this.fileService.deleteFile(this.fileId).subscribe({
      next: () => this.router.navigate(['/files']),
      error: () => (this.errorMessage = 'Delete failed. You may not have permission.'),
    });
  }

  goBack(): void {
    this.router.navigate(['/files']);
  }
}