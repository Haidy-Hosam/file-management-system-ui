import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { TranslatePipe } from '@ngx-translate/core';
import { LanguageService } from '../../core/services/language.service';
import { HttpErrorResponse } from '@angular/common/http';
@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule , TranslatePipe],
  templateUrl: './login.html',
  styleUrl: './login.css'
})
export class Login {
  email = '';
  password = '';
  keepSignedIn = true;
  errorMessage = '';
  isLoading = false;

  constructor(
    private languageService: LanguageService,
    private authService: AuthService,
    private router: Router
  ) {}

  changeLanguage(language: string): void {
  this.languageService.ChangeLanguage(language);
}
  onSubmit(): void {
    if (!this.email || !this.password) {
      this.errorMessage = 'Please enter both email and password.';
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';

    this.authService.login(this.email, this.password).subscribe({
  next: () => {
    this.isLoading = false;
    this.router.navigate(['/dashboard']);
  },
  error: (err: HttpErrorResponse) => {
    this.isLoading = false;
    if (err.status === 401 || err.status === 400) {
      this.errorMessage = 'Invalid email or password.';
    } else {
      this.errorMessage = 'Something went wrong. Please try again.';
    }
  }
});
  }
}