import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Department } from '../../../core/models/department.model';

@Component({
  selector: 'app-department-card',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './department-card.html',
  styleUrl: './department-card.css'
})
export class DepartmentCardComponent {
  @Input({ required: true }) department!: Department;
}
