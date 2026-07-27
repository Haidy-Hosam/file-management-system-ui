import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { UserService, UserResponse } from '../../core/services/user.service'; // adjust path if UserService lives elsewhere
import { FileService, FileResponse, PageResponse } from '../../core/services/file.service'; // adjust path if FileService lives elsewhere

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './profile.html',
  styleUrls: ['./profile.css'],
})
export class ProfileComponent implements OnInit {
  // profile header state
  profile: UserResponse | null = null;
  profileLoading = true;
  profileError: string | null = null;

  // file list state
  files: FileResponse[] = [];
  filesLoading = true;
  filesError: string | null = null;

  page = 0;
  size = 10;
  totalPages = 0;
  totalElements = 0;

  constructor(
    private userService: UserService,
    private fileService: FileService
  ) {}

  ngOnInit(): void {
    this.loadProfile();
    this.loadMyFiles();
  }

  loadProfile(): void {
    this.profileLoading = true;
    this.profileError = null;

    this.userService.getMyProfile().subscribe({
      next: (data: UserResponse) => {
        this.profile = data;
        this.profileLoading = false;
      },
      error: (err: HttpErrorResponse) => {
        this.profileError =
          err.status === 403
            ? "You don't have permission to view this profile."
            : 'Could not load profile. Please try again.';
        this.profileLoading = false;
      },
    });
  }

  loadMyFiles(): void {
    this.filesLoading = true;
    this.filesError = null;

    this.fileService.getMyFiles(this.page, this.size).subscribe({
      next: (result: PageResponse<FileResponse>) => {
        this.files = result.content;
        this.totalPages = result.totalPages;
        this.totalElements = result.totalElements;
        this.filesLoading = false;
      },
      error: () => {
        this.filesError = 'Could not load your files. Please try again.';
        this.filesLoading = false;
      },
    });
  }

  nextPage(): void {
    if (this.page + 1 < this.totalPages) {
      this.page++;
      this.loadMyFiles();
    }
  }

  prevPage(): void {
    if (this.page > 0) {
      this.page--;
      this.loadMyFiles();
    }
  }

  download(file: FileResponse): void {
    this.fileService.downloadFile(file.id).subscribe((blob: Blob) => {
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${file.name}.${file.extension}`;
      a.click();
      window.URL.revokeObjectURL(url);
    });
  }

  get initials(): string {
    if (!this.profile?.name) return '';
    return this.profile.name
      .split(' ')
      .map((part: string) => part.charAt(0).toUpperCase())
      .slice(0, 2)
      .join('');
  }
}