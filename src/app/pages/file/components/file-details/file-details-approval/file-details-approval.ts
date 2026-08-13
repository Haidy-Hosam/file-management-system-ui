import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslatePipe } from '@ngx-translate/core';
import { ApprovalStep } from '../../../services/file-details.service';

@Component({
  selector: 'app-file-details-approval',
  standalone: true,
  imports: [
    CommonModule,
    TranslatePipe
  ],
  templateUrl: './file-details-approval.html',
  styleUrl: './file-details-approval.css'
})
export class FileDetailsApproval {
  @Input() approvalSteps: ApprovalStep[] = [];
  @Input() isLoadingApprovals = false;

  get approvedSteps(): ApprovalStep[] {
    return this.approvalSteps.filter(s => s.status === 'APPROVED');
  }

  get pendingSteps(): ApprovalStep[] {
    return this.approvalSteps.filter(s => s.status === 'PENDING');
  }

  get rejectedSteps(): ApprovalStep[] {
    return this.approvalSteps.filter(s => s.status === 'REJECTED');
  }

  get approvalPercentage(): number {
    if (this.approvalSteps.length === 0) return 0;
    return Math.round((this.approvedSteps.length / this.approvalSteps.length) * 100);
  }

  /** SVG stroke-dashoffset for the progress ring (radius = 54, circumference ≈ 339.3) */
  get ringOffset(): number {
    const circumference = 2 * Math.PI * 54;
    return circumference - (this.approvalPercentage / 100) * circumference;
  }

  getInitials(name: string | null | undefined): string {
    if (!name) return '?';
    return name
      .split(' ')
      .map((part) => part.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  }

  getAvatarColor(name: string | null | undefined): string {
    const colors = ['#2563eb', '#0ea5b7', '#6b7280', '#1e293b', '#7c3aed', '#0d9488'];
    if (!name) return colors[0];
    const index = name.charCodeAt(0) % colors.length;
    return colors[index];
  }
}
