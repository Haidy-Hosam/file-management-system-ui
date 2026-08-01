export interface FileSearchRequest {
  name?: string;
  owners?: string[];
  departments?: string[];
  categories?: string[];
  statuses?: string[];

  fromDate?: string;      // yyyy-MM-dd
  toDate?: string;
  modifiedFrom?: string;
  modifiedTo?: string;

  sortBy?: string;
  sortDir?: 'asc' | 'desc';

  page?: number;
  size?: number;
}