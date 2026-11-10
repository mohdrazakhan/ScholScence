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

  const [cleanUrl, queryStr] = (state.url || '').split('?');
  const urlParams = new URLSearchParams(queryStr || '');
  const urlPath = cleanUrl.replace(/^\//, '');
  const primarySegment = urlPath.split('/')[0] || '';
  const tabParam = (urlParams.get('tab') || '').toLowerCase().trim();
  const typeParam = (urlParams.get('type') || '').toLowerCase().trim();

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

  // 4. Resolve exact service/sub-service code for hierarchical super-admin governance
  let requiredService: string | null = null;
  if (primarySegment === 'dashboard' || primarySegment === '') {
    requiredService = 'DASHBOARD';
  } else if (primarySegment === 'attendance') {
    requiredService = 'ATTENDANCE';
  } else if (primarySegment === 'homework') {
    requiredService = 'HOMEWORK';
  } else if (primarySegment === 'timetable') {
    if (typeParam === 'student') requiredService = 'TIMETABLE_STUDENT';
    else if (typeParam === 'faculty' || typeParam === 'teacher') requiredService = 'TIMETABLE_FACULTY';
    else if (typeParam === 'academic') requiredService = 'TIMETABLE_ACADEMIC';
    else requiredService = 'TIMETABLE';
  } else if (primarySegment === 'academics') {
    if (tabParam === 'classes') requiredService = 'ACADEMICS_CLASSES';
    else if (tabParam === 'subjects') requiredService = 'ACADEMICS_SUBJECTS';
    else if (tabParam === 'students') requiredService = 'ACADEMICS_STUDENTS';
    else if (tabParam === 'alumni') requiredService = 'ACADEMICS_ALUMNI';
    else if (tabParam === 'staff') requiredService = 'EMPLOYEES_TEACHING';
    else requiredService = 'ACADEMICS';
  } else if (primarySegment === 'exams') {
    if (tabParam === 'marksheets') requiredService = 'ACADEMICS_MARKSHEETS';
    else requiredService = 'EXAMS';
  } else if (primarySegment === 'fees') {
    requiredService = 'FEES';
  } else if (primarySegment === 'documents') {
    requiredService = 'DOCUMENTS';
  } else if (primarySegment === 'staff-users') {
    if (tabParam === 'payroll') requiredService = 'EMPLOYEES_PAYROLL';
    else requiredService = 'EMPLOYEES_NON_TEACHING';
  } else if (primarySegment === 'transport') {
    requiredService = 'TRANSPORT';
  } else if (primarySegment === 'communication') {
    requiredService = 'COMMUNICATION';
  } else if (primarySegment === 'complaints') {
    requiredService = 'COMPLAINTS';
  } else if (primarySegment === 'id-cards') {
    if (typeParam === 'student') requiredService = 'ID_CARD_STUDENT';
    else if (typeParam === 'teaching') requiredService = 'ID_CARD_TEACHING';
    else if (typeParam === 'non-teaching') requiredService = 'ID_CARD_NON_TEACHING';
    else requiredService = 'ID_CARD';
  } else if (primarySegment === 'subscription') {
    requiredService = 'SUBSCRIPTION';
  }

  if (requiredService && !authService.isServiceEnabled(requiredService)) {
    toast.error('Access Restricted: This module has been disabled by the platform administrator for your institution.');
    if (primarySegment !== 'dashboard' && authService.isServiceEnabled('DASHBOARD')) {
      router.navigate(['/dashboard']);
    } else {
      router.navigate(['/login']);
    }
    return false;
  }

  // 5. Section / Feature module permissions check for tenant users
  const sectionMap: Record<string, string> = {
    dashboard: 'dashboard',
    subscription: 'subscription',
    fees: 'fees',
    documents: 'documents',
    transport: 'transport',
    timetable: 'timetable',
    attendance: 'attendance',
    homework: 'homework',
    exams: 'exams',
    communication: 'communication',
    complaints: 'communication_complaints',
    academics: 'academics',
    'staff-users': 'staff_users',
    'id-cards': 'id_card',
  };

  const requiredSection = sectionMap[primarySegment];
  if (requiredSection && !authService.isSectionAllowedForUser(requiredSection)) {
    toast.error('Access Restricted: You do not have permission to access this module.');
    if (primarySegment !== 'dashboard' && authService.isSectionAllowedForUser('dashboard')) {
      router.navigate(['/dashboard']);
    } else {
      router.navigate(['/login']);
    }
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

