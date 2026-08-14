import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslatePipe } from '@ngx-translate/core';
import { FileActivity } from '../../../services/file-details.service';

@Component({
  selector: 'app-file-details-activity',
  standalone: true,
  imports: [
    CommonModule,
    TranslatePipe
  ],
  templateUrl: './file-details-activity.html',
  styleUrl: './file-details-activity.css'
})
export class FileDetailsActivity {
  @Input() activity: FileActivity[] = [];
}
