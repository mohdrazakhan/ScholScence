import { Injectable, signal, computed, inject } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, from, map, tap, of, throwError } from 'rxjs';
import { SupabaseService } from './supabase.service';
import { AuthResponse, User, AcademicSession } from '../models';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private readonly TOKEN_KEY = 'schoolsense_token';
  private readonly USER_KEY = 'schoolsense_user';
  private readonly SESSION_KEY = 'schoolsense_active_session';

  private supabase = inject(SupabaseService);
  private router = inject(Router);

  private readonly ROOT_BACKUP_KEY = 'schoolsense_root_session';

  // Angular Signals for Reactive State
  currentUser = signal<User | null>(this.getStoredUser());
  activeAcademicSession = signal<AcademicSession | null>(this.getStoredSession());
  
  isAuthenticated = computed(() => !!this.currentUser());
  userRole = computed(() => this.currentUser()?.role || '');
  isSupportSession = computed(() => !!this.currentUser()?.isSupportSession);
  activeSessionName = computed(() => this.activeAcademicSession()?.name || '2026–2027');

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

  searchSchools(query: string): Observable<any[]> {
    const q = (query || '').trim();
    if (q.length < 3) {
      return of([]);
    }
    return from(
      this.supabase.rpc('search_schools', { p_query: q })
    ).pipe(
      map(({ data, error }) => {
        if (error) {
          // Fallback to query with limit 5 if RPC not run yet
          return this.fallbackSearchSchools(q);
        }
        return data || [];
      })
    );
  }

  private async fallbackSearchSchools(query: string): Promise<any[]> {
    const { data } = await this.supabase
      .from('schools')
      .select('id, name, code, city, state')
      .eq('status', 'ACTIVE')
      .neq('code', 'PLATFORM')
      .or(`name.ilike.%${query}%,code.ilike.%${query}%,city.ilike.%${query}%`)
      .limit(5);
    return data || [];
  }

  getPublicSchools(): Observable<any[]> {
    return of([]);
  }

  login(identifier: string, password: string, schoolCode?: string): Observable<AuthResponse> {
    return from(
      this.supabase.rpc('authenticate_user', {
        p_identifier: identifier.trim(),
        p_password: password,
        p_school_code: schoolCode || null,
      })
    ).pipe(
      map(({ data, error }) => {
        if (error) {
          throw new Error(error.message || 'Invalid credentials');
        }
        return data as AuthResponse;
      }),
      tap((res) => {
        localStorage.setItem(this.TOKEN_KEY, res.accessToken);
        localStorage.setItem(this.USER_KEY, JSON.stringify(res.user));
        this.currentUser.set(res.user);
      })
    );
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
    return from(this.fetchSchoolsWithDetails());
  }

  private async fetchSchoolsWithDetails(): Promise<any[]> {
    // 1. Fetch core entities
    const [schoolsRes, usrRes, usersRes, rolesRes, studentsRes, classesRes, subjectsRes] = await Promise.all([
      this.supabase.from('schools').select('*').neq('code', 'PLATFORM').order('created_at', { ascending: false }),
      this.supabase.from('user_school_roles').select('*').eq('status', 'ACTIVE'),
      this.supabase.from('users').select('*'),
      this.supabase.from('roles').select('*'),
      this.supabase.from('students').select('id, school_id, status').eq('status', 'ACTIVE'),
      this.supabase.from('classes').select('id, school_id'),
      this.supabase.from('subjects').select('id, school_id'),
    ]);

    // Safe query for subscriptions and wallets (with zero-crash fallback)
    let subscriptions: any[] = [];
    let wallets: any[] = [];
    try {
      const subsRes = await this.supabase.from('school_subscriptions').select('*');
      if (subsRes?.data) subscriptions = subsRes.data;
    } catch {}

    try {
      const walletsRes = await this.supabase.from('school_wallets').select('*');
      if (walletsRes?.data) wallets = walletsRes.data;
    } catch {}

    // Read local cache overrides
    let localSubs: Record<string, any> = {};
    let localWallets: Record<string, any> = {};
    try {
      localSubs = JSON.parse(localStorage.getItem('schoolsense_saas_subscriptions') || '{}');
      localWallets = JSON.parse(localStorage.getItem('schoolsense_saas_wallets') || '{}');
    } catch {}

    const schools = schoolsRes.data || [];
    const usrList = usrRes.data || [];
    const users = usersRes.data || [];
    const roles = rolesRes.data || [];
    const students = studentsRes.data || [];
    const classes = classesRes.data || [];
    const subjects = subjectsRes.data || [];

    const userMap = new Map(users.map((u: any) => [u.id, u]));
    const roleMap = new Map(roles.map((r: any) => [r.id, r]));
    const subMap = new Map(subscriptions.map((sb: any) => [sb.school_id, sb]));
    const walletMap = new Map(wallets.map((w: any) => [w.school_id, w]));

    return schools.map((s: any) => {
      const schoolRoles = usrList.filter((usr: any) => usr.school_id === s.id);
      
      // Find admin user for this school
      let adminUser: any = null;
      for (const usr of schoolRoles) {
        const role = roleMap.get(usr.role_id);
        if (role?.code === 'SCHOOL_ADMIN' || role?.code === 'PRINCIPAL') {
          adminUser = userMap.get(usr.user_id);
          if (adminUser) break;
        }
      }

      // If no SCHOOL_ADMIN found, check any staff assigned to this school
      if (!adminUser && schoolRoles.length > 0) {
        adminUser = userMap.get(schoolRoles[0].user_id);
      }

      const schoolStudents = students.filter((st: any) => st.school_id === s.id).length;
      const schoolClasses = classes.filter((c: any) => c.school_id === s.id).length;
      const schoolSubjects = subjects.filter((sb: any) => sb.school_id === s.id).length;
      const schoolStaff = schoolRoles.length;

      const sub = subMap.get(s.id) || localSubs[s.id];
      const wallet = walletMap.get(s.id) || localWallets[s.id];

      return {
        ...s,
        admin: adminUser
          ? {
              id: adminUser.id,
              fullName: `${adminUser.first_name || ''} ${adminUser.last_name || ''}`.trim() || 'School Admin',
              firstName: adminUser.first_name,
              lastName: adminUser.last_name,
              email: adminUser.email,
              phone: adminUser.phone,
            }
          : null,
        subscription: {
          perStudentFee: Number(sub?.per_student_fee ?? sub?.perStudentFee) || 20.00,
          billingCycle: sub?.billing_cycle || sub?.billingCycle || 'MONTHLY',
          status: sub?.status || 'ACTIVE',
          nextBillingDate: sub?.next_billing_date || sub?.nextBillingDate,
        },
        wallet: {
          balance: Number(wallet?.balance) || 0.00,
          currency: wallet?.currency || 'INR',
          status: wallet?.status || 'ACTIVE',
        },
        stats: {
          studentsCount: schoolStudents,
          classesCount: schoolClasses,
          subjectsCount: schoolSubjects,
          staffCount: schoolStaff,
        },
      };
    });
  }

  onboardSchool(payload: any): Observable<any> {
    return from(
      this.supabase.rpc('onboard_school_tenant', {
        p_name: payload.name.trim(),
        p_code: payload.code.trim().toUpperCase(),
        p_email: payload.email || null,
        p_phone: payload.phone || null,
        p_address_line1: payload.addressLine1 || payload.address_line1 || null,
        p_city: payload.city.trim(),
        p_state: payload.state || null,
        p_country: payload.country || 'India',
        p_postal_code: payload.postalCode || payload.postal_code || null,
        p_admin_first_name: payload.adminFirstName.trim(),
        p_admin_last_name: payload.adminLastName ? payload.adminLastName.trim() : 'Admin',
        p_admin_email: payload.adminEmail ? payload.adminEmail.trim().toLowerCase() : null,
        p_admin_phone: payload.adminPhone ? payload.adminPhone.trim() : null,
        p_admin_password: payload.adminPassword || 'password123',
        p_per_student_fee: Number(payload.perStudentFee) || 20.00,
      })
    ).pipe(
      map(({ data, error }) => {
        if (error) {
          // If RPC with p_per_student_fee fails (e.g. older schema), retry without it or throw
          throw new Error(error.message || 'Failed to onboard school. Please verify code uniqueness.');
        }
        return data || { message: 'School provisioned successfully!' };
      })
    );
  }

  enterSupportSession(schoolId: string): Observable<AuthResponse> {
    const currentSuper = this.currentUser();
    return from(
      this.supabase.rpc('support_binary_login', {
        p_school_id: schoolId,
        p_root_user_id: currentSuper?.id || null,
      })
    ).pipe(
      map(({ data, error }) => {
        if (error) {
          throw new Error(error.message || 'Failed to initiate support session');
        }
        return data as AuthResponse;
      }),
      tap((res) => {
        // Backup root session before switching so super admin can return with 1-click
        if (currentSuper) {
          localStorage.setItem(
            this.ROOT_BACKUP_KEY,
            JSON.stringify({
              token: localStorage.getItem(this.TOKEN_KEY),
              user: currentSuper,
            })
          );
        }
        localStorage.setItem(this.TOKEN_KEY, res.accessToken);
        localStorage.setItem(this.USER_KEY, JSON.stringify(res.user));
        this.currentUser.set(res.user);
      })
    );
  }

  exitSupportSession(): void {
    const backupRaw = localStorage.getItem(this.ROOT_BACKUP_KEY);
    if (backupRaw) {
      try {
        const backup = JSON.parse(backupRaw);
        localStorage.setItem(this.TOKEN_KEY, backup.token);
        localStorage.setItem(this.USER_KEY, JSON.stringify(backup.user));
        localStorage.removeItem(this.ROOT_BACKUP_KEY);
        this.currentUser.set(backup.user);
        this.router.navigate(['/super-admin']);
        return;
      } catch (e) {
        console.error('Failed to restore root session', e);
      }
    }
    this.logout();
  }

  setActiveSession(session: AcademicSession | null) {
    if (session) {
      localStorage.setItem(this.SESSION_KEY, JSON.stringify(session));
    } else {
      localStorage.removeItem(this.SESSION_KEY);
    }
    this.activeAcademicSession.set(session);
  }

  logout(): void {
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.USER_KEY);
    localStorage.removeItem(this.ROOT_BACKUP_KEY);
    localStorage.removeItem(this.SESSION_KEY);
    this.currentUser.set(null);
    this.activeAcademicSession.set(null);
    this.router.navigate(['/login']);
  }

  getToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  private getStoredSession(): AcademicSession | null {
    const raw = localStorage.getItem(this.SESSION_KEY);
    if (!raw) return null;
    try {
      return JSON.parse(raw);
    } catch {
      return null;
    }
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
