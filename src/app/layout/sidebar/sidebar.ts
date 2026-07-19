import { Component, OnInit, signal } from '@angular/core';
import { RouterLink, RouterLinkActive, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { PageService } from '../../core/Services/page.service';
import { AuthService } from '../../core/Services/auth.service';
import {Page} from '../../core/models/page.model'

@Component({
  selector: 'app-sidebar',
  imports: [RouterLink, RouterLinkActive, CommonModule],
  templateUrl: './sidebar.html',
  styleUrl: './sidebar.css',
})
export class Sidebar implements OnInit {
  pages= signal<Page[]>([]);
  isLoading = signal(true);

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
}