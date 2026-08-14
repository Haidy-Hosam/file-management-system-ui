export interface EmployeeResponse {
  id: number;
  name: string;
  email: string;
  role: string | null;
  isManager: boolean;

}

export interface ReassignmentItem {
  employeeId: number;
  targetDepartmentId: number;
}

import type { FileResponse } from '../../pages/file/models/file.model';
export type { FileResponse };


export interface DepartmentDetails {
  id: number;
  name: string;
  managerName: string | null;
  isActive: boolean;
  employeeCount: number;
  employees: EmployeeResponse[] | null;
  fileCount: number;
  storageUsed: number;
  files: FileResponse[] | null;
}

export interface Department {
  id: number;
  name: string;
  head: string;
  members: number;
  files: number;
  storage: string;
  status: 'Active' | 'Inactive';
  themeColor: string;
}

export interface DepartmentLookUp{
  id:number;
  name:string
}

export interface CreateDepartmentRequest {
  name: string;
  isActive: boolean;
}