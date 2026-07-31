import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { PermissionsService } from '../services/permissions.service';
import { map, catchError, of, switchMap } from 'rxjs';

function ensurePermissionsLoaded(permissions: PermissionsService) {
  return permissions.loaded() ? of(true) : permissions.load().pipe(map(() => true));
}

export const authGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const permissions = inject(PermissionsService);
  const router = inject(Router);

  if (authService.isLoggedIn()) {
    return ensurePermissionsLoaded(permissions);
  }

  const refreshToken = authService.getRefreshToken();
  if (!refreshToken) {
    router.navigate(['/login']);
    return false;
  }

  return authService.refreshToken().pipe(
    switchMap(res => {
      authService.saveAccessToken(res.accessToken);
      if (res.refreshToken) authService.saveRefreshToken(res.refreshToken);
      return ensurePermissionsLoaded(permissions);
    }),
    catchError(() => {
      authService.logout();
      permissions.clear();
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
    if (!refreshToken) { router.navigate(['/login']); return false; }
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

export const permissionGuard = (page: string, permission: string): CanActivateFn => {
  return () => {
    const authService = inject(AuthService);
    const permissions = inject(PermissionsService);
    const router = inject(Router);

    if (!authService.isLoggedIn()) {
      router.navigate(['/login']);
      return false;
    }

    return ensurePermissionsLoaded(permissions).pipe(
      map(() => {
        if (permissions.has(page, permission)) return true;
        router.navigate(['/unauthorized']);
        return false;
      })
    );
  };
};