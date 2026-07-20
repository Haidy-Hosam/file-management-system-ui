import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DepartmentCardComponent } from '../../shared/components/department-card/department-card';
import { Department } from '../../core/models/department.model';

@Component({
  selector: 'app-departments',
  standalone: true,
  imports: [CommonModule, DepartmentCardComponent],
  templateUrl: './departments.html',
  styleUrl: './departments.css',
})
export class Departments {
  departments: Department[] = [
    { id: '1', name: 'Finance', head: 'Sarah Chen', members: 12, files: 340, storage: '18.4 GB', status: 'Active', themeColor: '#2563eb' },
    { id: '2', name: 'Human Resources', head: 'James Okafor', members: 8, files: 210, storage: '9.2 GB', status: 'Active', themeColor: '#0ea5e9' },
    { id: '3', name: 'Product', head: 'Maria Torres', members: 15, files: 480, storage: '24.1 GB', status: 'Active', themeColor: '#3b82f6' },
    { id: '4', name: 'Design', head: 'Alex Kim', members: 9, files: 620, storage: '48.7 GB', status: 'Active', themeColor: '#64748b' },
    { id: '5', name: 'Engineering', head: 'Tom Walsh', members: 24, files: 1240, storage: '86.3 GB', status: 'Active', themeColor: '#1e293b' },
    { id: '6', name: 'Marketing', head: 'Nina Patel', members: 11, files: 390, storage: '22.8 GB', status: 'Active', themeColor: '#7dd3fc' }
  ];
}
