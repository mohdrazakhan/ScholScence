import { Injectable, inject, signal } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { DOCUMENT } from '@angular/common';

export interface SchoolBrandingInfo {
  id?: string;
  name?: string;
  code?: string;
  logo_url?: string;
  logoUrl?: string;
}

export const DEFAULT_APP_TITLE = "SchoolSense: India's Simple School Management System with Live Parent Connect";
export const DEFAULT_APP_FAVICON = '/brand/icon.png';

@Injectable({ providedIn: 'root' })
export class SchoolBrandingService {
  private titleService = inject(Title);
  private doc = inject(DOCUMENT);

  /** Active branding state signal */
  currentBranding = signal<SchoolBrandingInfo | null>(null);

  /**
   * Sets the active school branding: document title + browser tab favicon.
   */
  setSchoolBranding(school: SchoolBrandingInfo | null, isSuperPlatform: boolean = false): void {
    this.currentBranding.set(school);

    if (isSuperPlatform) {
      this.titleService.setTitle('SchoolSense: Super Admin Platform Console');
      this.setFaviconHref(DEFAULT_APP_FAVICON);
      return;
    }

    if (school && school.name) {
      // 1. Dynamic Page Title: Show school name
      this.titleService.setTitle(school.name);

      // 2. Dynamic Favicon: Show school logo or generated PNG/SVG monogram
      let logoUrl = school.logoUrl || school.logo_url;
      if (!logoUrl && typeof localStorage !== 'undefined') {
        const cached = localStorage.getItem('schoolsense_selected_school_logo');
        if (cached && !cached.includes('/brand/icon.png')) {
          logoUrl = cached;
        }
      }
      if (!logoUrl) {
        logoUrl = this.generateSchoolMonogramFavicon(school.name, school.code);
      }

      if (typeof localStorage !== 'undefined') {
        try {
          localStorage.setItem('schoolsense_selected_school_name', school.name);
          if (school.code) {
            localStorage.setItem('schoolsense_selected_school_code', school.code);
          }
          if (logoUrl) {
            localStorage.setItem('schoolsense_selected_school_logo', logoUrl);
          }
        } catch {}
      }

      this.setFaviconHref(logoUrl);
    } else {
      this.resetToDefault();
    }
  }

  /**
   * Resets title and favicon back to default SchoolSense branding.
   */
  resetToDefault(): void {
    this.currentBranding.set(null);
    this.titleService.setTitle(DEFAULT_APP_TITLE);
    this.setFaviconHref(DEFAULT_APP_FAVICON);
    try {
      const suppressionStyle = this.doc.getElementById('schoolsense-forced-suppression');
      if (suppressionStyle) {
        suppressionStyle.remove();
      }
    } catch (e) {}
  }

  /**
   * Generates a high-contrast canvas PNG (with SVG fallback) monogram for schools without an uploaded logo.
   */
  generateSchoolMonogramFavicon(name: string, code?: string): string {
    const initials = (code || name.split(' ').map((w: string) => w[0]).join('')).slice(0, 3).toUpperCase() || 'SCH';

    if (typeof document !== 'undefined') {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = 64;
        canvas.height = 64;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          const grad = ctx.createLinearGradient(0, 0, 64, 64);
          grad.addColorStop(0, '#4f46e5');
          grad.addColorStop(1, '#0f172a');
          ctx.fillStyle = grad;

          if (typeof ctx.roundRect === 'function') {
            ctx.beginPath();
            ctx.roundRect(0, 0, 64, 64, 16);
            ctx.fill();
          } else {
            ctx.fillRect(0, 0, 64, 64);
          }

          ctx.fillStyle = '#ffffff';
          ctx.font = 'bold 24px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(initials, 32, 33);

          return canvas.toDataURL('image/png');
        }
      } catch (e) {}
    }

    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 64 64"><defs><linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#4f46e5"/><stop offset="100%" stop-color="#0f172a"/></linearGradient></defs><rect width="64" height="64" rx="16" fill="url(#g)"/><text x="32" y="38" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="22" font-weight="900" fill="#ffffff" text-anchor="middle" dominant-baseline="central">${initials}</text></svg>`;
    const encoded = typeof btoa !== 'undefined' ? btoa(svg) : encodeURIComponent(svg);
    return typeof btoa !== 'undefined' ? `data:image/svg+xml;base64,${encoded}` : `data:image/svg+xml;utf8,${encoded}`;
  }

  /**
   * Dynamically replaces or updates favicon <link> elements to force instant browser tab icon refresh.
   */
  setFaviconHref(href: string): void {
    if (!this.doc || typeof this.doc.querySelector === 'undefined') return;

    const cleanHref = href.split('?')[0].toLowerCase();
    const mimeType = (cleanHref.endsWith('.svg') || href.indexOf('image/svg') !== -1)
      ? 'image/svg+xml'
      : (cleanHref.endsWith('.png') || href.indexOf('image/png') !== -1)
      ? 'image/png'
      : (cleanHref.endsWith('.jpg') || cleanHref.endsWith('.jpeg') || href.indexOf('image/jpeg') !== -1)
      ? 'image/jpeg'
      : (cleanHref.endsWith('.webp') || href.indexOf('image/webp') !== -1)
      ? 'image/webp'
      : 'image/x-icon';

    let favicon = this.doc.getElementById('app-favicon') as HTMLLinkElement | null;
    if (!favicon) {
      favicon = this.doc.createElement('link');
      favicon.id = 'app-favicon';
      favicon.rel = 'icon';
      this.doc.head.appendChild(favicon);
    }
    favicon.type = mimeType;
    favicon.href = href;

    let shortcutFavicon = this.doc.getElementById('app-shortcut-favicon') as HTMLLinkElement | null;
    if (!shortcutFavicon) {
      shortcutFavicon = this.doc.createElement('link');
      shortcutFavicon.id = 'app-shortcut-favicon';
      shortcutFavicon.rel = 'shortcut icon';
      this.doc.head.appendChild(shortcutFavicon);
    }
    shortcutFavicon.type = mimeType;
    shortcutFavicon.href = href;

    let appleFavicon = this.doc.getElementById('app-apple-favicon') as HTMLLinkElement | null;
    if (!appleFavicon) {
      appleFavicon = this.doc.createElement('link');
      appleFavicon.id = 'app-apple-favicon';
      appleFavicon.rel = 'apple-touch-icon';
      this.doc.head.appendChild(appleFavicon);
    }
    appleFavicon.href = href;

    // Clean up any extraneous non-managed favicon links
    const existing = this.doc.querySelectorAll("link[rel*='icon']");
    existing.forEach((el) => {
      if (el.id !== 'app-favicon' && el.id !== 'app-shortcut-favicon' && el.id !== 'app-apple-favicon') {
        el.remove();
      }
    });
  }
}
