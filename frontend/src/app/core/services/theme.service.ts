import { Injectable, signal, effect } from '@angular/core';

export type AppTheme = 'light' | 'dark' | 'system';

@Injectable({
  providedIn: 'root',
})
export class ThemeService {
  private readonly THEME_KEY = 'schoolsense_theme';

  // Current selected preference ('light' | 'dark' | 'system')
  theme = signal<AppTheme>('light');

  // Computed actual active state (true if dark mode is active on <html>)
  isDark = signal<boolean>(false);

  constructor() {
    this.initTheme();

    // Listen to system preference changes if in 'system' mode
    if (typeof window !== 'undefined' && window.matchMedia) {
      window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
        if (this.theme() === 'system') {
          this.applyTheme(e.matches ? 'dark' : 'light');
        }
      });
    }
  }

  private initTheme() {
    if (typeof window === 'undefined') return;

    try {
      const saved = localStorage.getItem(this.THEME_KEY) as AppTheme | null;
      if (saved && (saved === 'light' || saved === 'dark' || saved === 'system')) {
        this.theme.set(saved);
        if (saved === 'system') {
          const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
          this.applyTheme(prefersDark ? 'dark' : 'light');
        } else {
          this.applyTheme(saved);
        }
      } else {
        // Default to light
        this.theme.set('light');
        this.applyTheme('light');
      }
    } catch {
      this.theme.set('light');
      this.applyTheme('light');
    }
  }

  setTheme(theme: AppTheme) {
    this.theme.set(theme);
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(this.THEME_KEY, theme);
      } catch {}

      if (theme === 'system') {
        const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
        this.applyTheme(prefersDark ? 'dark' : 'light');
      } else {
        this.applyTheme(theme);
      }
    }
  }

  toggleTheme() {
    const next = this.isDark() ? 'light' : 'dark';
    this.setTheme(next);
  }

  private applyTheme(resolved: 'light' | 'dark') {
    const root = document.documentElement;
    if (resolved === 'dark') {
      root.classList.add('dark');
      this.isDark.set(true);
    } else {
      root.classList.remove('dark');
      this.isDark.set(false);
    }
  }
}
