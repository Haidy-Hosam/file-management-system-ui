import { Routes } from '@angular/router';
import { Login } from './pages/login/login';
import { Dashboard } from './pages/dashboard/dashboard';
import { Files } from './pages/files/files';
import { FileDetails } from './pages/file-details/file-details';
import { Departments } from './pages/departments/departments';
import { Users } from './pages/users/users';
import { Roles } from './pages/roles/roles';
import { MainLayout } from './layout/main-layout/main-layout';
import { authGuard, roleGuard } from './core/auth/auth.guard';
export const routes: Routes = [
  {
    path: 'login',
    component: Login,
  },
  {
    path: '',
    component: MainLayout,
    canActivate: [authGuard],
    children: [
      {
        path: 'dashboard',
        component: Dashboard,
      },
      {
        path: 'files',
        component: Files,
      },
      {
        path: 'files/:id',
        component: FileDetails,
      },
      {
        path: 'departments',
        component: Departments,
        canActivate: [roleGuard(['ADMIN'])],
      },
      {
        path: 'users',
        component: Users,
        canActivate: [roleGuard(['ADMIN'])],
      },
      {
        path: 'roles',
        component: Roles,
        canActivate: [roleGuard(['ADMIN'])],
      },
      
    ],
  },
];
