import { Injectable } from '@angular/core';

/**
 * Resolves the school context from the browser URL, enabling per-school
 * portal addresses such as:
 *
 *   https://dha.schoolsense.in          (production wildcard subdomain)
 *   https://dha.uat.schoolsense.in      (staging wildcard subdomain)
 *   http://dha.localhost:4300           (local development)
 *   https://uat-schoolsense.vercel.app/login?school=dha   (fallback for
 *        hosts where wildcards are not possible, e.g. *.vercel.app)
 *
 * Priority: ?school= query param beats the hostname (it lets support staff
 * preview any school from any domain). A dismissal flag in sessionStorage
 * stops the forced school from re-applying after the user chooses
 * "Change School", until they open a fresh page on that address.
 *
 * Detection NEVER decides authorisation — the login still verifies the
 * user's membership of the selected school server-side. It only
 * pre-selects which school's portal is shown.
 */

const DISMISS_KEY = 'schoolsense_subdomain_dismissed';
const PARAM_KEY = 'school';

/** Base domains whose subdomains map to schools. Checked right-to-left. */
const MANAGED_BASE_DOMAINS = ['schoolsense.in', 'localhost'];

@Injectable({ providedIn: 'root' })
export class SchoolContextService {
  /**
   * Returns the subdomain that should force a specific school portal,
   * or null when there is none (or the user dismissed it).
   */
  detectForcedSubdomain(): string | null {
    try {
      if (sessionStorage.getItem(DISMISS_KEY) === '1') return null;

      // 1. Explicit ?school= param — highest priority, works on every host.
      const param = new URLSearchParams(window.location.search).get(PARAM_KEY);
      if (param && this.isValidSubdomain(param)) return param.toLowerCase();

      // 2. Hostname: dha.schoolsense.in / dha.uat.schoolsense.in / dha.localhost
      const host = window.location.hostname.toLowerCase();
      for (const base of MANAGED_BASE_DOMAINS) {
        if (host === base || host === `www.${base}`) continue; // main site — no forced school
        if (host.endsWith(`.${base}`)) {
          const sub = host.slice(0, -1 * (base.length + 1));
          // take the LEFT-most label only: dha.uat.schoolsense.in -> dha
          const first = sub.split('.')[0];
          if (this.isValidSubdomain(first)) return first;
        }
      }

      // 3. dha.localhost style for local dev is covered above ('localhost' base).
      return null;
    } catch {
      return null;
    }
  }

  /** Called when the user chooses "Change School" on a forced portal. */
  dismiss(): void {
    try {
      sessionStorage.setItem(DISMISS_KEY, '1');
    } catch {
      /* private mode — dismissal simply won't persist */
    }
  }

  private isValidSubdomain(value: string): boolean {
    return /^[a-z0-9][a-z0-9-]{1,39}$/.test(value.toLowerCase());
  }
}
