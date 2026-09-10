import { inject } from '@angular/core';
import { Router, CanActivateFn, CanActivateChildFn } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { ToastService } from '../services/toast.service';

export const authGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);
  const toast = inject(ToastService);

  if (!authService.isAuthenticated()) {
    router.navigate(['/login']);
    return false;
  }

  const isSuper = authService.isSuperAdmin();
  const urlPath = (state.url || '').split('?')[0].replace(/^\//, '');
  const primarySegment = urlPath.split('/')[0] || '';

  // 1. Super Admin root accounts are strictly restricted to Super Admin Governance
  if (isSuper) {
    if (primarySegment !== 'super-admin') {
      router.navigate(['/super-admin']);
      return false;
    }
    return true;
  }

  // 2. School members cannot access Super Admin root portal
  if (primarySegment === 'super-admin') {
    router.navigate(['/dashboard']);
    return false;
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
    toast.error(`The ${requiredService} service is currently restricted by platform administration.`);
    router.navigate(['/dashboard']);
    return false;
  }

  return true;
};

export const authChildGuard: CanActivateChildFn = authGuard;
