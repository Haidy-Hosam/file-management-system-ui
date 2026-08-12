import { Injectable, signal } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';

@Injectable({
  providedIn: 'root',
})
export class LanguageService {


  currentLang = signal<string>(localStorage.getItem('language') || 'en');

  constructor(private translate: TranslateService) {
    this.translate.addLangs(['en', 'ar']);
    this.translate.setFallbackLang('en');
  }

  initialLanguage(): void {
    const language = localStorage.getItem('language') || 'en';
    this.translate.use(language);
    document.documentElement.lang = language;
    document.documentElement.dir = language === 'ar' ? 'rtl' : 'ltr';
    this.currentLang.set(language);
  }

  ChangeLanguage(language: string): void {
    this.translate.use(language);
    localStorage.setItem('language', language);
    document.documentElement.lang = language;
    document.documentElement.dir = language === 'ar' ? 'rtl' : 'ltr';
    this.currentLang.set(language);
  }
}