import { CommonModule } from '@angular/common';
import {
  Component,
  EventEmitter,
  Input,
  Output
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TranslatePipe } from '@ngx-translate/core';

@Component({
  selector: 'app-file-upload',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    TranslatePipe
  ],
  templateUrl: './file-upload.html',
  styleUrl: './file-upload.css'
})
export class FileUpload {

  // =========================================================
  // INPUTS
  // =========================================================

  @Input() showUploadModal = false;

  @Input() currentStep = 1;

  @Input() totalSteps = 5;

  @Input() isDragging = false;

  @Input() isUploading = false;

  @Input() canSubmitUpload = false;


  @Input() uploadItems: any[] = [];

  @Input() uploadRejections: any[] = [];

  @Input() uploadDepartments: any[] = [];

  @Input() selectedDepartmentIds: any[] = [];

  @Input() fileTypes: any[] = [];

  @Input() securitylevels: any[] = [];


  @Input() maxFileSizeMB = 0;

  @Input() maxFilesPerUpload = 0;


  // =========================================================
  // FUNCTIONS FROM PARENT
  // =========================================================

  @Input() isDepartmentSelected!: (departmentId: any) => boolean;

  @Input() getDepartmentName!: (departmentId: any) => string;

  @Input() getSecurityLevelName!: (securityLevelId: any) => string;

  @Input() getFileTypeName!: (fileTypeId: any) => string;

  @Input() canGoNext!: () => boolean;


  // =========================================================
  // OUTPUTS
  // =========================================================

  @Output() close = new EventEmitter<void>();

  @Output() goToStep = new EventEmitter<number>();

  @Output() fileSelected = new EventEmitter<Event>();

  @Output() dragOver = new EventEmitter<DragEvent>();

  @Output() dragLeave = new EventEmitter<DragEvent>();

  @Output() drop = new EventEmitter<DragEvent>();

  @Output() removeItem = new EventEmitter<number>();

  @Output() toggleDepartment = new EventEmitter<any>();

  @Output() prevStep = new EventEmitter<void>();

  @Output() nextStep = new EventEmitter<void>();

  @Output() submit = new EventEmitter<void>();


  // =========================================================
  // UI EVENTS
  // =========================================================

  onClose(): void {
    this.close.emit();
  }


  onGoToStep(step: number): void {
    this.goToStep.emit(step);
  }


  onFileSelected(event: Event): void {
    this.fileSelected.emit(event);
  }


  onDragOver(event: DragEvent): void {
    this.dragOver.emit(event);
  }


  onDragLeave(event: DragEvent): void {
    this.dragLeave.emit(event);
  }


  onDrop(event: DragEvent): void {
    this.drop.emit(event);
  }


  onBrowse(fileInput: HTMLInputElement): void {
    fileInput.click();
  }


  onRemoveItem(index: number): void {
    this.removeItem.emit(index);
  }


  onToggleDepartment(departmentId: any): void {
    this.toggleDepartment.emit(departmentId);
  }


  onPrevStep(): void {
    this.prevStep.emit();
  }


  onNextStep(): void {
    this.nextStep.emit();
  }


  onSubmit(): void {
    this.submit.emit();
  }
}