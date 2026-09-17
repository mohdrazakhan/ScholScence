import { Component, effect, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Title } from '@angular/platform-browser';
import { AuthService } from './core/services/auth.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet],
  template: `<router-outlet></router-outlet>`,
})
export class AppComponent {
  private titleService = inject(Title);
  private auth = inject(AuthService);

  constructor() {
    effect(() => {
      const user = this.auth.currentUser();
      const school = user?.school;
      const isSuperPlatform =
        (user?.role === 'SUPER_ADMIN' || user?.role === 'PLATFORM_ADMIN') && !user?.isSupportSession;

      // 1. Dynamic Page Title: Show logged-in school name (or super admin console / default)
      if (school?.name && !isSuperPlatform) {
        this.titleService.setTitle(`${school.name}`);
      } else if (isSuperPlatform) {
        this.titleService.setTitle('SchoolSense — Super Admin Platform Console');
      } else {
        this.titleService.setTitle('SchoolSense — Multi-Tenant School OS');
      }

      // 2. Dynamic Favicon: Show logged-in school logo or custom generated monogram
      this.updateFavicon(school, isSuperPlatform);
    });
  }

  private updateFavicon(school: any, isSuperPlatform: boolean) {
    const logoUrl = school?.logoUrl || school?.logo_url;
    let targetFavicon = '/brand/icon.png';

    if (logoUrl && !isSuperPlatform) {
      targetFavicon = logoUrl;
    } else if (school?.name && !isSuperPlatform) {
      targetFavicon = this.generateSchoolMonogramFavicon(school.name, school.code);
    }

    this.setFaviconHref(targetFavicon);
  }

  private generateSchoolMonogramFavicon(name: string, code?: string): string {
    const initials = (code || name.split(' ').map((w: string) => w[0]).join('')).slice(0, 3).toUpperCase() || 'SCH';
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><defs><linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#4f46e5"/><stop offset="100%" stop-color="#0f172a"/></linearGradient></defs><rect width="64" height="64" rx="16" fill="url(#g)"/><text x="32" y="38" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="22" font-weight="900" fill="#ffffff" text-anchor="middle" dominant-baseline="central">${initials}</text></svg>`;
    return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
  }

  private setFaviconHref(href: string) {
    if (typeof document === 'undefined') return;

    const mimeType = href.endsWith('.png') || href.startsWith('data:image/png')
      ? 'image/png'
      : href.endsWith('.svg') || href.startsWith('data:image/svg')
      ? 'image/svg+xml'
      : 'image/x-icon';

    let link: HTMLLinkElement | null = document.querySelector("link[rel='icon']");
    if (!link) {
      link = document.createElement('link');
      link.rel = 'icon';
      document.head.appendChild(link);
    }
    link.type = mimeType;
    link.href = href;

    let shortcutLink: HTMLLinkElement | null = document.querySelector("link[rel='shortcut icon']");
    if (!shortcutLink) {
      shortcutLink = document.createElement('link');
      shortcutLink.rel = 'shortcut icon';
      document.head.appendChild(shortcutLink);
    }
    shortcutLink.type = mimeType;
    shortcutLink.href = href;
  }
}
