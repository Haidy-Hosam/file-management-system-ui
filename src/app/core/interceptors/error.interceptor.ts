import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { AuthService } from '../services/auth.service';

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const router = inject(Router);
  const authService = inject(AuthService);

  return next(req).pipe(
    catchError(err => {
          console.log("ErrorInterceptor:", err.status, req.url);

      if (err.status === 401) {
            console.log("Logging out user...");

        authService.logout();
        router.navigate(['/login']);
      } else if (err.status === 403) {
    
        router.navigate(['/unauthorized']);
      }
      return throwError(() => err);
    })
  );
};