export interface FileResponse {
  id: number;
  name: string;
  extension: string;
  departmentNames: string[];
  size: string;
  modifiedDate: string;
  createdDate: string;
  status: string;
  fileType: string;
  ownerName: string;
}

export interface FileRequest {
  file: File;
  department_id: number;
  fileType_id: number;
}

export interface PageResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
  first: boolean;
  last: boolean;
}