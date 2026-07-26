import { Permission } from './permission.model';

export interface PagePermissionGroup {
  page: { pageId: number; pageName: string };
  permissions: Permission[];
}

export interface Role {
  id: number;
  name: string;
  description?: string;
  pagePermissions: PagePermissionGroup[];
}

export interface PagePermissionRequest {
  pageId: number;
  permissionIds: number[];
}

export interface RoleRequest {
  name: string;
  description?: string;
  pagePermissions: PagePermissionRequest[];
}