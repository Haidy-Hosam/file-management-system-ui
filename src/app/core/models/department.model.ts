export interface Department {
  id: string;
  name: string;
  head: string;
  members: number;
  files: number;
  storage: string;
  status: 'Active' | 'Inactive';
  themeColor: string;
}
