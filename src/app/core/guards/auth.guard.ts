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

    const hasRole = (userRole: string | null) => {
      if (!userRole) return false;
      const normalizedUserRole = userRole.replace('ROLE_', '').toUpperCase();
      return allowedRoles.some(r => r.replace('ROLE_', '').toUpperCase() === normalizedUserRole);
    };

    if (authService.isLoggedIn()) {
      const role = authService.getRole();
      if (hasRole(role)) return true;
      router.navigate(['/dashboard']);
      return false;
    }

    const refreshToken = authService.getRefreshToken();
    if (!refreshToken) { router.navigate(['/login']); return false; }

    return authService.refreshToken().pipe(
      map(res => {
        authService.saveAccessToken(res.accessToken);
        if (res.refreshToken) authService.saveRefreshToken(res.refreshToken);
        const role = authService.getRole();
        if (hasRole(role)) return true;
        router.navigate(['/dashboard']);
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

export const permissionGuard = (page: string, permission: string | string[]): CanActivateFn => {
  return () => {
    const authService = inject(AuthService);
    const permissions = inject(PermissionsService);
    const router = inject(Router);

    if (!authService.isLoggedIn()) {
      router.navigate(['/login']);
      return false;
    }

    const required = Array.isArray(permission) ? permission : [permission];

    return ensurePermissionsLoaded(permissions).pipe(
      map(() => {
        if (required.some(p => permissions.has(page, p))) return true;
        router.navigate(['/unauthorized']);
        return false;
      })
    );
  };
};