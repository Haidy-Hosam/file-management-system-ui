import { Login } from './pages/login/login';
import { Dashboard } from './pages/dashboard/dashboard';
import { Files } from './pages/files/files';
import { Profile } from './pages/profile/profile';
import { FileDetails } from './pages/file-details/file-details';
import { Departments } from './pages/departments/departments';
import { DepartmentDetailsComponent } from './pages/department-details/department-details';
import { Users } from './pages/users/users';
import { Roles } from './pages/roles/roles';
import { Trash } from './pages/trash/trash';
import { MainLayout } from './layout/main-layout/main-layout';
import { authGuard, roleGuard } from './core/guards/auth.guard';
import { Routes } from '@angular/router';
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
        path: 'trash',
        component: Trash,
        canActivate: [roleGuard(['ADMIN'])],
      },
      {
        path: 'departments',
        component: Departments,
        canActivate: [roleGuard(['ADMIN'])],
      },
      { path: 'departments/:id',
       component: DepartmentDetailsComponent,
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
      {
         path: 'profile', 
         component: Profile
       }
    ],
  },
];
