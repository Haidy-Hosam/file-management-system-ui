import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';

export interface AppConfig {
  maxFileSizeMB: number;
  maxFilesPerUpload: number;
}

const DEFAULTS: AppConfig = {
  maxFileSizeMB: 20,
  maxFilesPerUpload: 10,
};

@Injectable({ providedIn: 'root' })
export class AppConfigService {
  private config: AppConfig = { ...DEFAULTS };

  constructor(private http: HttpClient) {}

  /** Called once at bootstrap via APP_INITIALIZER. */
  load(): Promise<void> {
    return firstValueFrom(
      this.http.get<AppConfig>('/assets/app.config.json')
    )
      .then(cfg => {
        this.config = { ...DEFAULTS, ...cfg };
      })
      .catch(() => {
        // Config file missing or malformed — fall back to defaults silently.
        this.config = { ...DEFAULTS };
      });
  }

  get maxFileSizeMB(): number {
    return this.config.maxFileSizeMB;
  }

  /** Limit in bytes — convenience getter used in validation. */
  get maxFileSizeBytes(): number {
    return this.config.maxFileSizeMB * 1024 * 1024;
  }

  get maxFilesPerUpload(): number {
    return this.config.maxFilesPerUpload;
  }
}
