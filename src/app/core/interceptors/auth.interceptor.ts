import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth.service';
import { catchError, switchMap, throwError } from 'rxjs';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const token = authService.getToken();
  console.log("AuthInterceptor:", req.url);

  const isAuthUrl = req.url.includes('/api/auth/');

  if (token && !isAuthUrl) {
    req = req.clone({
      setHeaders: { Authorization: `Bearer ${token}` }
    });
  }
console.log("Sending request...");
  return next(req).pipe(

  catchError(error => {

    console.log("AuthInterceptor caught:", error.status, req.url);

    if (error.status === 403 && !isAuthUrl) {

      console.log("Trying Refresh...");

      return authService.refreshToken().pipe(

        switchMap(res => {

          console.log("Refresh Success");

          authService.saveAccessToken(res.accessToken);

          if (res.refreshToken) {
            authService.saveRefreshToken(res.refreshToken);
          }

          const cloned = req.clone({
            setHeaders: {
              Authorization: `Bearer ${res.accessToken}`
            }
          });

          console.log("Retrying original request");

          return next(cloned);
        }),

        catchError(err => {

          console.log("Refresh Failed", err.status);

          return throwError(() => err);
        })
      );
    }

    console.log(error);
    return throwError(() => error);

  })
);
}