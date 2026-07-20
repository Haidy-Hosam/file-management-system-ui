import { Injectable } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';

@Injectable({
  providedIn: 'root',
})
export class LanguageService {
  constructor(private translate: TranslateService) {
    this.translate.addLangs(['en', 'ar']);
    this.translate.setFallbackLang('en');
  }

  initialLanguage(): void {
    const language = localStorage.getItem('language') || 'en';
    //  console.log('Language:', language);
    this.translate.use(language);
    document.documentElement.lang = language;
    document.documentElement.dir = language === 'ar' ? 'rtl' : 'ltr';
  }

  ChangeLanguage(language: string): void {
    this.translate.use(language);
    localStorage.setItem('language', language);

    document.documentElement.lang = language;
    document.documentElement.dir = language === 'ar' ? 'rtl' : 'ltr';
  }
}
