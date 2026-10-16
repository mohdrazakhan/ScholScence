import { inject } from '@angular/core';
import { Router, CanActivateFn, CanActivateChildFn } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { SchoolContextService } from '../services/school-context.service';
import { ToastService } from '../services/toast.service';

export const authGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);
  const toast = inject(ToastService);

  if (!authService.isAuthenticated()) {
    router.navigate(['/login']);
    return false;
  }

  const urlPath = (state.url || '').split('?')[0].replace(/^\//, '');
  const primarySegment = urlPath.split('/')[0] || '';

  const isSuper = authService.isSuperAdmin();
  const isSupport = authService.isSupportSession();

  // 1. Root Developer's home is /super-admin. If visiting /dashboard without a support session, route to /super-admin
  if (isSuper && !isSupport && (primarySegment === 'dashboard' || primarySegment === '')) {
    router.navigate(['/super-admin']);
    return false;
  }

  // 2. STRICT RULE: Developer Console (/super-admin) is exclusively accessible by the root Binary Developer
  if (primarySegment === 'super-admin') {
    if (!isSuper || isSupport) {
      toast.error('Access Denied: Highly restricted developer console. Accessible only by the root platform developer.');
      router.navigate(['/dashboard']);
      return false;
    }
    return true;
  }

  // 3. Super Admin root accounts have universal access across remaining routes and services
  if (isSuper) {
    return true;
  }

  // 3. Service restrictions check for tenant users
  const serviceMap: Record<string, string> = {
    timetable: 'TIMETABLE',
    attendance: 'ATTENDANCE',
    homework: 'HOMEWORK',
    exams: 'EXAMS',
    communication: 'COMMUNICATION',
    complaints: 'COMPLAINTS',
    academics: 'ACADEMICS',
  };

  const requiredService = serviceMap[primarySegment];
  if (requiredService && !authService.isServiceEnabled(requiredService)) {
    toast.error(`Access Restricted: Your role does not have permission to access the ${requiredService.toLowerCase()} section.`);
    router.navigate(['/dashboard']);
    return false;
  }

  return true;
};

export const authChildGuard: CanActivateChildFn = authGuard;

/**
 * Guards public marketing website routes.
 * When on a school-specific subdomain (e.g. dha.schoolsense.in or dha.localhost:4300),
 * visitors should go directly to the school portal (/login or /dashboard) instead of the marketing website.
 */
export const publicSubdomainGuard: CanActivateFn = () => {
  const schoolContext = inject(SchoolContextService);
  const authService = inject(AuthService);
  const router = inject(Router);

  const forcedSubdomain = schoolContext.detectForcedSubdomain();
  if (forcedSubdomain) {
    if (authService.isAuthenticated()) {
      router.navigate(['/dashboard']);
    } else {
      router.navigate(['/login']);
    }
    return false;
  }

  return true;
};

