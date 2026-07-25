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

export interface FileResponse {
  id: number;
  name: string;
  extension: string;
  departmentNames: string[];
  status: string;
  fileType: string;
  size: number;
  modifiedDate: string;
}


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


export interface CreateDepartmentRequest {
  name: string;
  isActive: boolean;
}
