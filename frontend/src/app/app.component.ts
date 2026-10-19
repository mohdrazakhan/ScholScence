import { Component, effect, inject, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { AuthService } from './core/services/auth.service';
import { SchoolBrandingService } from './core/services/school-branding.service';
import { SchoolContextService } from './core/services/school-context.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet],
  template: `<router-outlet></router-outlet>`,
})
export class AppComponent implements OnInit {
  private auth = inject(AuthService);
  private branding = inject(SchoolBrandingService);
  private schoolContext = inject(SchoolContextService);

  constructor() {
    effect(() => {
      const user = this.auth.currentUser();
      if (user) {
        const isSuperPlatform =
          (user?.role === 'SUPER_ADMIN' || user?.role === 'PLATFORM_ADMIN') && !user?.isSupportSession;
        this.branding.setSchoolBranding(user.school, isSuperPlatform);
      } else {
        const forcedSub = this.schoolContext.detectForcedSubdomain();
        if (!forcedSub) {
          if (typeof window !== 'undefined' && !window.location.pathname.includes('/login')) {
            this.branding.resetToDefault();
          }
        }
      }
    });
  }

  ngOnInit() {
    void this.checkForcedSubdomainBranding();
  }

  private async checkForcedSubdomainBranding() {
    const forcedSub = this.schoolContext.detectForcedSubdomain();
    if (!forcedSub) return;

    // Fast-path: display cached school name & logo from localStorage immediately
    if (typeof localStorage !== 'undefined') {
      const cachedName = localStorage.getItem('schoolsense_selected_school_name');
      const cachedLogo = localStorage.getItem('schoolsense_selected_school_logo');
      const cachedCode = localStorage.getItem('schoolsense_selected_school_code');
      if (cachedName) {
        this.branding.setSchoolBranding({
          name: cachedName,
          logo_url: cachedLogo || undefined,
          code: cachedCode || undefined,
        });
      }
    }

    // Resolve up-to-date branding from backend
    try {
      const profile = await this.auth.getSchoolBySubdomain(forcedSub);
      if (profile) {
        this.branding.setSchoolBranding(profile);
        if (typeof localStorage !== 'undefined') {
          localStorage.setItem('schoolsense_selected_school_name', profile.name);
          localStorage.setItem('schoolsense_selected_school_code', profile.code || '');
          if (profile.logo_url) {
            localStorage.setItem('schoolsense_selected_school_logo', profile.logo_url);
          }
        }
      }
    } catch {}
  }
}
