import { Component, HostListener, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { NotificationBell } from "../../shared/notification-bell/notification-bell";
import { TranslatePipe } from '@ngx-translate/core';
import { LanguageService } from '../../core/services/language.service';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, NotificationBell, TranslatePipe],
  templateUrl: './navbar.html',
  styleUrl: './navbar.css',
})
export class Navbar {
  searchTerm = '';
  showUserMenu = false;

  otherLang = computed<'en' | 'ar'>(() =>
  this.languageService.currentLang() === 'en' ? 'ar' : 'en'
);

otherLangLabel = computed(() => (this.otherLang() === 'ar' ? 'العربية' : 'English'));

constructor(
  private authService: AuthService,
  private languageService: LanguageService,
  private router: Router
) {}

toggleLanguage(): void {
  this.languageService.ChangeLanguage(this.otherLang());
}

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
    this.router.navigate(['/files'], { queryParams: { q: this.searchTerm } });
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}