import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { UserService, UserResponse } from '../../core/services/user.service';
import { FileService, FileResponse, PageResponse } from '../file/services/file.service';
import { FileForwardService } from '../file/services/file-forward.service';
import { FileForwardResponse } from '../file/models/FileForward.model';
import { TranslatePipe } from '@ngx-translate/core';

type ProfileTab = 'FILES' | 'SENT' | 'RECEIVED';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, TranslatePipe],
  templateUrl: './profile.html',
  styleUrls: ['./profile.css'],
})
export class ProfileComponent implements OnInit {
  userId: number | null = null; // null = viewing your own profile

  profile: UserResponse | null = null;
  profileLoading = true;
  profileError: string | null = null;

  activeTab: ProfileTab = 'FILES';

  files: FileResponse[] = [];
  filesLoading = true;
  filesError: string | null = null;

  page = 0;
  size = 10;
  totalPages = 0;
  totalElements = 0;

  sentForwards: FileForwardResponse[] = [];
  sentLoading = false;
  sentLoaded = false;
  sentError: string | null = null;

  receivedForwards: FileForwardResponse[] = [];
  receivedLoading = false;
  receivedLoaded = false;
  receivedError: string | null = null;

  constructor(
    private route: ActivatedRoute,
    private userService: UserService,
    private fileService: FileService,
    private fileForwardService: FileForwardService
  ) {}

  ngOnInit(): void {
    const idParam = this.route.snapshot.paramMap.get('id');
    this.userId = idParam ? Number(idParam) : null;

    this.loadProfile();
    this.loadFiles();
  }

  get isOwnProfile(): boolean {
    return this.userId === null;
  }

  setTab(tab: ProfileTab): void {
    this.activeTab = tab;
    if (tab === 'SENT' && !this.sentLoaded) this.loadSentForwards();
    if (tab === 'RECEIVED' && !this.receivedLoaded) this.loadReceivedForwards();
  }

  loadSentForwards(): void {
  this.sentLoading = true;
  this.sentError = null;
  this.fileForwardService.getSentForwards(this.userId ?? undefined).subscribe({
    next: (data) => { this.sentForwards = data; this.sentLoading = false; this.sentLoaded = true; },
    error: (err: HttpErrorResponse) => {
      this.sentError = err.status === 404
        ? "You don't have permission to view this."
        : 'Could not load sent files.';
      this.sentLoading = false;
    }
  });
}
  loadReceivedForwards(): void {
    this.receivedLoading = true;
    this.receivedError = null;
    this.fileForwardService.getReceivedForwards().subscribe({
      next: (data) => { this.receivedForwards = data; this.receivedLoading = false; this.receivedLoaded = true; },
      error: () => { this.receivedError = 'Could not load received files.'; this.receivedLoading = false; }
    });
  }

  loadProfile(): void {
    this.profileLoading = true;
    this.profileError = null;

    const request$ = this.userId
      ? this.userService.getUserById(this.userId)
      : this.userService.getMyProfile();

    request$.subscribe({
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

  loadFiles(): void {
    this.filesLoading = true;
    this.filesError = null;

    const request$ = this.userId
      ? this.fileService.getFilesByUser(this.userId, this.page, this.size)
      : this.fileService.getMyFiles(this.page, this.size);

    request$.subscribe({
      next: (result: PageResponse<FileResponse>) => {
        this.files = result.content;
        this.totalPages = result.totalPages;
        this.totalElements = result.totalElements;
        this.filesLoading = false;
      },
      error: () => {
        this.filesError = 'Could not load files. Please try again.';
        this.filesLoading = false;
      },
    });
  }

  nextPage(): void {
    if (this.page + 1 < this.totalPages) {
      this.page++;
      this.loadFiles();
    }
  }

  prevPage(): void {
    if (this.page > 0) {
      this.page--;
      this.loadFiles();
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

  openReceivedForward(fwd: FileForwardResponse): void {
  if (fwd.isRead) return;
  this.fileForwardService.openForward(fwd.id).subscribe({
    next: (updated) => {
      const idx = this.receivedForwards.findIndex(f => f.id === fwd.id);
      if (idx > -1) this.receivedForwards[idx] = updated;
    }
  });
}
}