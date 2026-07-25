import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { map, catchError, of } from 'rxjs';

export const authGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (authService.isLoggedIn()){
    console.log("you are logged in (guard)");
    return true;
  } 

  const refreshToken = authService.getRefreshToken();
  if (!refreshToken) {
      console.log("No refresh token , i will navigate to login (guard)");
    router.navigate(['/login']);
    return false;
  }

  return authService.refreshToken().pipe(
    map(res => {
      authService.saveAccessToken(res.accessToken);
      if (res.refreshToken) authService.saveRefreshToken(res.refreshToken);
            console.log("refresh token saved(guard) ");

      return true;
    }),
    catchError(() => {
      authService.logout();
      router.navigate(['/login']);
      return of(false);
    })
  );
};


export const roleGuard = (allowedRoles: string[]): CanActivateFn => {
  return () => {
    const authService = inject(AuthService);
    const router = inject(Router);

    if (authService.isLoggedIn()) {
      const role = authService.getRole();
      if (role && allowedRoles.includes(role)) return true;
      router.navigate(['/unauthorized']); 
      return false;
    }

    const refreshToken = authService.getRefreshToken();
    if (!refreshToken) {
      router.navigate(['/login']);
      return false;
    }

    return authService.refreshToken().pipe(
      map(res => {
        authService.saveAccessToken(res.accessToken);
        if (res.refreshToken) authService.saveRefreshToken(res.refreshToken);

        const role = authService.getRole();
        if (role && allowedRoles.includes(role)) return true;

        router.navigate(['/unauthorized']);
        return false;
      }),
      catchError(() => {
        authService.logout();
        router.navigate(['/login']);
        return of(false);
      })
    );
  };
};