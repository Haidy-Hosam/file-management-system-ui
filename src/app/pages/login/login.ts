import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { UserService } from '../../core/Services/user.service';
import { PermissionService } from '../../core/Services/permission.service';
import { AuthService } from '../../core/Services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './login.html',
  styleUrl: './login.css',
})
export class Login {
  email = '';
  password = '';
  errorMessage = '';
  isLoading = false;

  constructor(
    private authService: AuthService,
    private userService: UserService,
    private permissionService: PermissionService,
    private router: Router,
  ) {}

  onSubmit(): void {
    if (!this.email || !this.password) {
      this.errorMessage = 'Please enter both email and password.';
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';

    this.authService.login(this.email, this.password).subscribe({
      next: () => {
        this.userService.getpages().subscribe({
          next: (pages) => {
            this.permissionService.setPages(pages);
            this.isLoading = false;
            this.router.navigate(['/dashboard']);
          },
        });
      },
      error: (err) => {
        this.isLoading = false;
        this.errorMessage = "Couldn't load user permissions .";
      },
    });
  }
}
