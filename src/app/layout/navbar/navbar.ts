import { Component, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-navbar',
  standalone: true,
    imports: [
    CommonModule,
    FormsModule,
    RouterModule
  ],
  templateUrl: './navbar.html',
  styleUrl: './navbar.css',
})
export class Navbar {
  searchTerm = '';
  showUserMenu = false;

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  get userEmail(): string | null {
    return this.authService.getDecodedToken()?.sub ?? null;
  }

  get userRole(): string | null {
    return this.authService.getRole();
  }

  get userInitials(): string {
    const email = this.userEmail;
    return email ? email.charAt(0).toUpperCase() : '?';
  }

  toggleUserMenu(event: Event): void {
    event.stopPropagation();
    this.showUserMenu = !this.showUserMenu;
  }

  @HostListener('document:click')
  closeUserMenu(): void {
    this.showUserMenu = false;
  }

  onSearchSubmit(): void {
    if (!this.searchTerm.trim()) return;
    // adjust destination/query param name to match your Files search implementation
    this.router.navigate(['/files'], { queryParams: { q: this.searchTerm } });
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}