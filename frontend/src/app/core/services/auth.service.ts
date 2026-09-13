import { Injectable, signal, computed, inject } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, from, map, tap, of, throwError } from 'rxjs';
import { SupabaseService } from './supabase.service';
import { AuthResponse, User } from '../models';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private readonly TOKEN_KEY = 'schoolsense_token';
  private readonly USER_KEY = 'schoolsense_user';

  private supabase = inject(SupabaseService);
  private router = inject(Router);

  // Angular Signals for Reactive State
  currentUser = signal<User | null>(this.getStoredUser());
  isAuthenticated = computed(() => !!this.currentUser());
  userRole = computed(() => this.currentUser()?.role || '');

  isAdmin = computed(() => ['SCHOOL_ADMIN', 'PRINCIPAL', 'SUPER_ADMIN', 'PLATFORM_ADMIN'].includes(this.userRole()));
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
    if (this.isSuperAdmin()) return true;
    const disabled = this.currentUser()?.school?.disabledServices || [];
    return !disabled.includes(serviceCode);
  }

  constructor() {}

  getPublicSchools(): Observable<any[]> {
    return from(
      this.supabase
        .from('schools')
        .select('*')
        .eq('status', 'ACTIVE')
        .neq('code', 'PLATFORM')
        .order('name', { ascending: true })
    ).pipe(
      map(({ data, error }) => {
        if (error) throw error;
        return data || [];
      })
    );
  }

  login(identifier: string, password: string, schoolCode?: string): Observable<AuthResponse> {
    return from(this.authenticateWithSupabase(identifier.trim(), password, schoolCode)).pipe(
      tap((res) => {
        localStorage.setItem(this.TOKEN_KEY, res.accessToken);
        localStorage.setItem(this.USER_KEY, JSON.stringify(res.user));
        this.currentUser.set(res.user);
      })
    );
  }

  private async authenticateWithSupabase(
    identifier: string,
    password: string,
    schoolCode?: string
  ): Promise<AuthResponse> {
    // 1. Find user by email or phone
    const { data: userRecord, error: userError } = await this.supabase
      .from('users')
      .select('*')
      .or(`email.ilike.${identifier},phone.eq.${identifier}`)
      .single();

    if (userError || !userRecord) {
      throw new Error('Invalid email/phone or password');
    }

    // 2. Fetch User School Roles + Roles + Schools
    const { data: userSchoolRoles, error: usrError } = await this.supabase
      .from('user_school_roles')
      .select('*, role:roles(*), school:schools(*)')
      .eq('user_id', userRecord.id)
      .eq('status', 'ACTIVE');

    if (usrError || !userSchoolRoles || userSchoolRoles.length === 0) {
      throw new Error('No active school role found for this user');
    }

    // Check if Super Admin
    const isSuper =
      userSchoolRoles.some(
        (usr: any) => usr.role?.code === 'SUPER_ADMIN' || usr.role?.code === 'PLATFORM_ADMIN'
      ) || userRecord.email === 'admin@schoolscence.in';

    let selectedRole = userSchoolRoles[0];

    // If schoolCode supplied and not super admin, match the school
    if (schoolCode && !isSuper) {
      const matched = userSchoolRoles.find(
        (usr: any) => usr.school?.code?.toUpperCase() === schoolCode.toUpperCase()
      );
      if (!matched) {
        throw new Error('User is not assigned to this school');
      }
      selectedRole = matched;
    }

    const roleCode = isSuper ? 'SUPER_ADMIN' : selectedRole.role?.code || 'STAFF';
    const roleName = isSuper ? 'Super Admin' : selectedRole.role?.name || 'Staff';

    const userObj: User = {
      id: userRecord.id,
      email: userRecord.email || '',
      phone: userRecord.phone || '',
      firstName: userRecord.first_name,
      lastName: userRecord.last_name || '',
      role: roleCode,
      roleName: roleName,
      school: selectedRole.school
        ? {
            id: selectedRole.school.id,
            name: selectedRole.school.name,
            code: selectedRole.school.code,
            status: selectedRole.school.status,
            disabledServices: [],
          }
        : undefined,
      permissions: isSuper ? ['*'] : [],
    };

    return {
      accessToken: 'supabase-session-' + userRecord.id,
      refreshToken: 'supabase-refresh-' + userRecord.id,
      user: userObj,
    };
  }

  fetchProfile(): Observable<User> {
    const current = this.currentUser();
    if (!current) return throwError(() => new Error('Not logged in'));

    return from(
      this.supabase
        .from('users')
        .select('*')
        .eq('id', current.id)
        .single()
    ).pipe(
      map(({ data, error }) => {
        if (error || !data) throw error || new Error('User not found');
        return current;
      })
    );
  }

  updateSchoolStatus(schoolId: string, status: string): Observable<any> {
    return from(
      this.supabase
        .from('schools')
        .update({ status, updated_at: new Date().toISOString() })
        .eq('id', schoolId)
    ).pipe(
      map(({ data, error }) => {
        if (error) throw error;
        return { success: true };
      })
    );
  }

  updateSchoolServices(schoolId: string, disabledServices: string[]): Observable<any> {
    return of({ success: true, disabledServices });
  }

  getAllSchools(): Observable<any[]> {
    return from(
      this.supabase
        .from('schools')
        .select('*, user_school_roles(id), students(id)')
        .neq('code', 'PLATFORM')
        .order('created_at', { ascending: false })
    ).pipe(
      map(({ data, error }) => {
        if (error) throw error;
        return (data || []).map((s: any) => ({
          ...s,
          totalStudents: s.students?.length || 0,
          totalStaff: s.user_school_roles?.length || 0,
        }));
      })
    );
  }

  onboardSchool(payload: any): Observable<any> {
    return from(this.performOnboarding(payload));
  }

  private async performOnboarding(payload: any) {
    // 1. Create School
    const { data: newSchool, error: schoolErr } = await this.supabase
      .from('schools')
      .insert({
        name: payload.name,
        code: payload.code.toUpperCase(),
        email: payload.email,
        phone: payload.phone,
        address_line1: payload.addressLine1 || payload.address_line1,
        city: payload.city,
        state: payload.state,
        country: payload.country || 'India',
        postal_code: payload.postalCode || payload.postal_code,
        status: 'ACTIVE',
      })
      .select()
      .single();

    if (schoolErr || !newSchool) {
      throw schoolErr || new Error('Failed to create school');
    }

    // 2. Create School Admin User if email provided
    if (payload.adminEmail) {
      const { data: adminUser, error: userErr } = await this.supabase
        .from('users')
        .insert({
          email: payload.adminEmail,
          first_name: payload.adminFirstName || 'School',
          last_name: payload.adminLastName || 'Admin',
          status: 'ACTIVE',
        })
        .select()
        .single();

      if (adminUser) {
        // Fetch SCHOOL_ADMIN role
        const { data: adminRole } = await this.supabase
          .from('roles')
          .select('id')
          .eq('code', 'SCHOOL_ADMIN')
          .single();

        if (adminRole) {
          await this.supabase.from('user_school_roles').insert({
            user_id: adminUser.id,
            school_id: newSchool.id,
            role_id: adminRole.id,
            status: 'ACTIVE',
          });
        }
      }
    }

    return newSchool;
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
