import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideRouter } from '@angular/router';

import { routes } from './app.routes';
import { authInterceptor } from './core/interceptors/auth.interceptor';
import { errorInterceptor } from './core/interceptors/error.interceptor';
import { provideAppTranslate } from './app.translate';
import {
  ApplicationConfig,
  inject,
  provideAppInitializer,
  provideBrowserGlobalErrorListeners,
  provideZoneChangeDetection,
} from '@angular/core';
import { LanguageService } from './core/services/language.service';
import { AppConfigService } from './core/services/app-config.service';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    provideHttpClient(withInterceptors([errorInterceptor, authInterceptor])),
    provideAppTranslate(),

    // Loads public/assets/app.config.json before the app renders.
    // Change maxFileSizeMB / maxFilesPerUpload there — no rebuild needed.
    provideAppInitializer(() => {
      const configService = inject(AppConfigService);
      return configService.load();
    }),

    provideAppInitializer(() => {
      const languageService = inject(LanguageService);
      return languageService.initialLanguage();
    }),
  ],
};
