import { Injectable, signal } from '@angular/core';
import { en } from '../i18n/en';
import { vi } from '../i18n/vi';

export type Language = 'vi' | 'en';

@Injectable({ providedIn: 'root' })
export class LanguageService {
  currentLang = signal<Language>('vi');

  get t(): typeof vi {
    return this.currentLang() === 'vi' ? vi : (en as typeof vi);
  }

  toggle() {
    this.currentLang.set(this.currentLang() === 'vi' ? 'en' : 'vi');
  }

  setLanguage(lang: Language) {
    this.currentLang.set(lang);
  }
}
