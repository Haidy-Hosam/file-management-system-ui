import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth.service';
import { catchError, switchMap, throwError } from 'rxjs';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
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

        })

    );

}

    return throwError(() => error);

  })

);
};