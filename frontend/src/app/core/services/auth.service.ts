import { Injectable, signal, computed } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, tap } from 'rxjs';
import { ApiService } from './api.service';
import { AuthResponse, User } from '../models';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private readonly TOKEN_KEY = 'schoolsense_token';
  private readonly USER_KEY = 'schoolsense_user';

  // Angular Signals for Reactive State
  currentUser = signal<User | null>(this.getStoredUser());
  isAuthenticated = computed(() => !!this.currentUser());
  userRole = computed(() => this.currentUser()?.role || '');

  isAdmin = computed(() => ['SCHOOL_ADMIN', 'PRINCIPAL'].includes(this.userRole()));
  isPrincipal = computed(() => this.userRole() === 'PRINCIPAL');
  isSchoolAdmin = computed(() => this.userRole() === 'SCHOOL_ADMIN');
  isSuperAdmin = computed(() => ['PLATFORM_ADMIN', 'SUPER_ADMIN'].includes(this.userRole()));
  isTeacher = computed(() => ['TEACHER', 'CLASS_TEACHER'].includes(this.userRole()));
  isClassTeacher = computed(() => {
    const scope = this.currentUser()?.teachingScope;
    return !!(scope?.classTeacherSections && scope.classTeacherSections.length > 0);
  });
  isParent = computed(() => ['GUARDIAN', 'PARENT'].includes(this.userRole()));

  isServiceEnabled(serviceCode: string): boolean {
    const disabled = this.currentUser()?.school?.disabledServices || [];
    return !disabled.includes(serviceCode);
  }


  constructor(
    private api: ApiService,
    private router: Router,
  ) {}

  getPublicSchools(): Observable<any[]> {
    return this.api.get<any[]>('schools/public');
  }

  login(identifier: string, password: string, schoolCode?: string): Observable<AuthResponse> {
    return this.api
      .post<AuthResponse>('auth/login', { identifier, password, schoolCode })
      .pipe(
        tap((res) => {
          localStorage.setItem(this.TOKEN_KEY, res.accessToken);
          localStorage.setItem(this.USER_KEY, JSON.stringify(res.user));
          this.currentUser.set(res.user);
        }),
      );
  }

  fetchProfile(): Observable<User> {
    return this.api.get<User>('auth/me').pipe(
      tap((user) => {
        localStorage.setItem(this.USER_KEY, JSON.stringify(user));
        this.currentUser.set(user);
      }),
    );
  }

  updateSchoolStatus(schoolId: string, status: string): Observable<any> {
    return this.api.patch<any>(`schools/${schoolId}/status`, { status });
  }

  updateSchoolServices(schoolId: string, disabledServices: string[]): Observable<any> {
    return this.api.patch<any>(`schools/${schoolId}/services`, { disabledServices });
  }

  getAllSchools(): Observable<any[]> {
    return this.api.get<any[]>('schools/all');
  }

  onboardSchool(payload: any): Observable<any> {
    return this.api.post<any>('schools/onboard', payload);
  }

  logout(): void {
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.USER_KEY);
    this.currentUser.set(null);
    this.router.navigate(['/login']);
  }

  getToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  private getStoredUser(): User | null {
    const raw = localStorage.getItem(this.USER_KEY);
    if (!raw) return null;
    try {
      return JSON.parse(raw);
    } catch {
      return null;
    }
  }
}
