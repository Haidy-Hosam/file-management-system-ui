import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth.service';
import { Router } from '@angular/router';
import { catchError, switchMap, throwError } from 'rxjs';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const router = inject(Router);
  const token = authService.getToken();

  const isAuthUrl = req.url.includes('/api/auth/');

  if (token && !isAuthUrl) {
    req = req.clone({
      setHeaders: { Authorization: `Bearer ${token}` }
    });
  }

  return next(req).pipe(
    catchError(error => {
      if (error.status === 401 && !isAuthUrl) {
        const refreshToken = authService.getRefreshToken();
        if (!refreshToken) {
          authService.logout();
          router.navigate(['/login']);
          return throwError(() => error);
        }

        return authService.refreshToken().pipe(
          switchMap(res => {
            authService.saveAccessToken(res.accessToken);

            if (res.refreshToken) {
              authService.saveRefreshToken(res.refreshToken);
            }

            const cloned = req.clone({
              setHeaders: {
                Authorization: `Bearer ${res.accessToken}`
              }
            });

            return next(cloned);
          }),
          catchError(err => {
            console.log("Refresh Failed", err.status);
            authService.logout();
            router.navigate(['/login']);
            return throwError(() => err);
          })
        );
      }

      return throwError(() => error);
    })
  );
};