import { Login } from './pages/login/login';
import { Dashboard } from './pages/dashboard/dashboard';
import { Files } from './pages/files/files';
import { ProfileComponent } from './pages/profile/profile';
import { FileDetails } from './pages/file-details/file-details';
import { Departments } from './pages/departments/departments';
import { DepartmentDetailsComponent } from './pages/department-details/department-details';
import { Users } from './pages/users/users';
import { Roles } from './pages/roles/roles';
import { Trash } from './pages/trash/trash';
import { MainLayout } from './layout/main-layout/main-layout';
import { authGuard, roleGuard, permissionGuard } from './core/guards/auth.guard';
import { Routes } from '@angular/router';
import { NotificationsPage } from './pages/notifications-page/notifications-page';
import { SecurityLevelsComponent } from './pages/security-levels/security-levels';

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
        canActivate: [permissionGuard('Departments', ['READ_ALL', 'READ_SCOPED'])]
      },
      { path: 'departments/:id',
       component: DepartmentDetailsComponent,
        canActivate: [permissionGuard('Departments', ['READ_ALL', 'READ_SCOPED'])],
      },
      {
        path: 'users',
        component: Users,
        canActivate: [permissionGuard('Users', ['READ_ALL', 'READ_SCOPED'])],
      },
      {
        path: 'roles',
        component: Roles,
        canActivate: [permissionGuard('Roles', 'READ')],
      },
      {
      path: 'profile',
      component: ProfileComponent
     },
     {
      path:'notifications',
      component:NotificationsPage
     },
     {
     path: 'users/:id',
     component: ProfileComponent
     },
     {
       path: 'security-levels',
       component: SecurityLevelsComponent,
       canActivate: [roleGuard(['ADMIN'])],
     }
    ],
  },
];
