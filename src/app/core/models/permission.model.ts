export interface Permission {
  permissionId: number;
  permissionName: string;
}

export interface PageInfo {
  pageId: number;
  pageName: string;
  route: string;
}

export interface PagePermission {
  page: PageInfo;
  permissions: Permission[];
}