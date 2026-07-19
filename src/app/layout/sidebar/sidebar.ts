import { Component, OnInit } from '@angular/core';
import { RouterLink, RouterLinkActive, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../core/auth/auth.service';
import { PageService, PageResponse } from '../../core/pages/page.service';

@Component({
  selector: 'app-sidebar',
  imports: [RouterLink, RouterLinkActive, CommonModule],
  templateUrl: './sidebar.html',
  styleUrl: './sidebar.css',
})
export class Sidebar implements OnInit {
  pages: PageResponse[] = [];
  isLoading = true;

  constructor(
    private authService: AuthService,
    private pageService: PageService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.pageService.getMyPages().subscribe({
      next: (pages) => {
        this.pages = pages;
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Failed to load pages', err);
        this.isLoading = false;
      }
    });
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}