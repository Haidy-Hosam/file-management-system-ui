import { Component, OnInit, signal, computed } from '@angular/core';
import { RouterLink, RouterLinkActive, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../core/services/auth.service';
import { PageService } from '../../core/services/page.service';
import { Page } from '../../core/models/page.model';

import { UserService } from '../../core/services/user.service';
import { User } from '../../core/models/user.model';

@Component({
  selector: 'app-sidebar',
  imports: [RouterLink, RouterLinkActive, CommonModule],
  templateUrl: './sidebar.html',
  styleUrl: './sidebar.css',
})
export class Sidebar implements OnInit {
  pages = signal<Page[]>([]);
  currentUser = signal<User | null>(null);
  isLoading = signal(true);

  visiblePages = computed(() =>
    this.pages().filter(page => {
      const normalizedRoute = page.route?.replace(/^\/+/, '').toLowerCase() || '';
      const normalizedName = page.name?.toLowerCase() || '';
      
      return !normalizedRoute.startsWith('file-details') && 
             !normalizedRoute.startsWith('department-details') && 
             !normalizedRoute.startsWith('files/') &&
             !normalizedName.includes('file-details') &&
             !normalizedName.includes('department-details');
    })
  );

  constructor(
    private authService: AuthService,
    private pageService: PageService,
    private userService: UserService,
    private router: Router,
  ) {}

  ngOnInit(): void {
    this.userService.getCurrentUser().subscribe({
      next: (user) => {
        this.currentUser.set(user);
      },
      error: (err) => {
        console.error(err);
      },
    });
    this.pageService.getMyPages().subscribe({
      next: (pages) => {
        this.pages.set(pages);
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('Failed to load pages', err);
        this.isLoading.set(false);
      },
    });
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }

  get userEmail(): string | null {
    return this.authService.getDecodedToken()?.sub ?? null;
  }

  get userRole(): string | null {
    return this.authService.getRole();
  }

  get userInitials(): string {
    const email = this.userEmail;
    if (!email) return '?';
    return email.charAt(0).toUpperCase();
  }

getIconClass(route: string): string {
  const icons: Record<string, string> = {
    'dashboard': 'bi-grid-1x2-fill',
    'files': 'bi-file-earmark-text-fill',
    'users': 'bi-people-fill',
    'roles': 'bi-shield-lock-fill',
    'departments': 'bi-building',
    'trash': 'bi-trash3-fill',
  };
  const normalized = route?.replace(/^\/+|\/+$/g, '').toLowerCase() ?? '';
  return icons[normalized] ?? 'bi-list';
}
}