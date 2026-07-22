import { Component, OnInit, signal, computed } from '@angular/core';
import { RouterLink, RouterLinkActive, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../core/services/auth.service';
import { PageService } from '../../core/services/page.service';
import { Page } from '../../core/models/page.model';

@Component({
  selector: 'app-sidebar',
  imports: [RouterLink, RouterLinkActive, CommonModule],
  templateUrl: './sidebar.html',
  styleUrl: './sidebar.css',
})
export class Sidebar implements OnInit {
  pages = signal<Page[]>([]);
  isLoading = signal(true);

  visiblePages = computed(() =>
    this.pages().filter(page => {
      const normalized = page.route?.replace(/^\/+/, '');
      return normalized !== 'file-details' && !normalized?.startsWith('files/');
    })
  );

  constructor(
    private authService: AuthService,
    private pageService: PageService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.pageService.getMyPages().subscribe({
      next: (pages) => {
        this.pages.set(pages);
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('Failed to load pages', err);
        this.isLoading.set(false);
      }
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

  /**
   * Returns the inner SVG markup (stroke-based, Lucide-style) for a given route.
   * Rendered via [innerHTML] inside an <svg class="nav-icon"> wrapper in the template.
   */
  getIconInner(route: string): string {
    const icons: Record<string, string> = {
      '/dashboard': `
        <rect width="7" height="9" x="3" y="3" rx="1"></rect>
        <rect width="7" height="5" x="14" y="3" rx="1"></rect>
        <rect width="7" height="9" x="14" y="12" rx="1"></rect>
        <rect width="7" height="5" x="3" y="16" rx="1"></rect>
      `,
      '/files': `
        <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"></path>
        <polyline points="14 2 14 8 20 8"></polyline>
      `,
      '/users': `
        <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path>
        <circle cx="9" cy="7" r="4"></circle>
        <path d="M22 21v-2a4 4 0 0 0-3-3.87"></path>
        <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
      `,
      '/roles': `
        <path d="M20 13c0 5-3.5 7.5-7.5 8.5-.16.03-.34.03-.5 0C8 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.5 3.8 17 5 19 5a1 1 0 0 1 1 1z"></path>
        <path d="m9 12 2 2 4-4"></path>
      `,
      '/departments': `
        <path d="M6 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18Z"></path>
        <path d="M6 12H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h2"></path>
        <path d="M18 9h2a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-2"></path>
        <path d="M10 6h4"></path>
        <path d="M10 10h4"></path>
        <path d="M10 14h4"></path>
        <path d="M10 18h4"></path>
      `,
    };
    return icons[route] ?? `
      <line x1="4" y1="6" x2="20" y2="6"></line>
      <line x1="4" y1="12" x2="20" y2="12"></line>
      <line x1="4" y1="18" x2="20" y2="18"></line>
    `;
  }
}