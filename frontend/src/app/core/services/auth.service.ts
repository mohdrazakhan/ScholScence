import { Injectable, signal, computed, inject } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, from, map, tap, of, throwError } from 'rxjs';
import { SupabaseService } from './supabase.service';
import { AuthResponse, User, AcademicSession } from '../models';

export const DEFAULT_ROLE_PERMISSIONS: Record<string, string[]> = {
  SUPER_ADMIN: [
    'dashboard',
    'academics',
    'academics_classes',
    'academics_students',
    'academics_alumni',
    'academics_staff',
    'academics_subjects',
    'timetable',
    'timetable_student',
    'timetable_faculty',
    'timetable_academic',
    'attendance',
    'homework',
    'exams',
    'communication',
    'communication_notices',
    'communication_complaints',
    'subscription',
  ],
  SCHOOL_ADMIN: [
    'dashboard',
    'academics',
    'academics_classes',
    'academics_students',
    'academics_alumni',
    'academics_staff',
    'academics_subjects',
    'timetable',
    'timetable_student',
    'timetable_faculty',
    'timetable_academic',
    'attendance',
    'homework',
    'exams',
    'communication',
    'communication_notices',
    'communication_complaints',
    'subscription',
  ],
  PRINCIPAL: [
    'dashboard',
    'academics',
    'academics_classes',
    'academics_students',
    'academics_alumni',
    'academics_staff',
    'academics_subjects',
    'timetable',
    'timetable_student',
    'timetable_faculty',
    'timetable_academic',
    'attendance',
    'homework',
    'exams',
    'communication',
    'communication_notices',
    'communication_complaints',
    'subscription',
  ],
  CLASS_TEACHER: [
    'dashboard',
    'academics',
    'academics_classes',
    'academics_students',
    'academics_alumni',
    'academics_subjects',
    'timetable',
    'timetable_student',
    'timetable_faculty',
    'timetable_academic',
    'attendance',
    'homework',
    'exams',
    'communication',
    'communication_notices',
    'communication_complaints',
  ],
  TEACHER: [
    'dashboard',
    'academics',
    'academics_subjects',
    'timetable',
    'timetable_student',
    'timetable_faculty',
    'timetable_academic',
    'attendance',
    'homework',
    'exams',
    'communication',
    'communication_notices',
    'communication_complaints',
  ],
  FEE_MANAGER: [
    'dashboard',
    'academics',
    'academics_students',
    'academics_alumni',
    'communication',
    'communication_notices',
    'subscription',
  ],
  GUARDIAN: [
    'dashboard',
    'timetable',
    'timetable_student',
    'timetable_academic',
    'attendance',
    'homework',
    'exams',
    'communication',
    'communication_notices',
    'communication_complaints',
  ],
  PARENT: [
    'dashboard',
    'timetable',
    'timetable_student',
    'timetable_academic',
    'attendance',
    'homework',
    'exams',
    'communication',
    'communication_notices',
    'communication_complaints',
  ],
  STUDENT: [
    'dashboard',
    'timetable',
    'timetable_student',
    'timetable_academic',
    'attendance',
    'homework',
    'exams',
    'communication',
    'communication_notices',
  ],
};

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private readonly TOKEN_KEY = 'schoolsense_token';
  private readonly USER_KEY = 'schoolsense_user';
  private readonly SESSION_KEY = 'schoolsense_active_session';
  private readonly ROLE_PERMS_KEY_PREFIX = 'schoolsense_role_perms_';

  private supabase = inject(SupabaseService);
  private router = inject(Router);

  private readonly ROOT_BACKUP_KEY = 'schoolsense_root_session';

  // Angular Signals for Reactive State
  currentUser = signal<User | null>(this.getStoredUser());
  activeAcademicSession = signal<AcademicSession | null>(this.getStoredSession());
  rolePermissions = signal<Record<string, string[]>>(this.loadInitialRolePermissions());
  
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

  /**
   * Check if a specific section / service is allowed for the active user based on role permissions
   */
  isSectionAllowedForUser(sectionId: string): boolean {
    if (this.isSuperAdmin() || this.isSupportSession()) return true;

    const role = this.userRole();
    if (!role) return false;

    // Super Admin & Platform Admin have universal access
    if (role === 'SUPER_ADMIN' || role === 'PLATFORM_ADMIN') return true;

    // Map any aliases
    const normalizedId = this.normalizeSectionId(sectionId);

    const perms = this.rolePermissions();
    const roleList = perms[role] || DEFAULT_ROLE_PERMISSIONS[role] || [];

    // If checking child section (e.g. academics_students), ensure parent (academics) is also enabled
    const parentMap: Record<string, string> = {
      academics_classes: 'academics',
      academics_students: 'academics',
      academics_alumni: 'academics',
      academics_staff: 'academics',
      academics_subjects: 'academics',
      timetable_student: 'timetable',
      timetable_faculty: 'timetable',
      timetable_academic: 'timetable',
      communication_notices: 'communication',
      communication_complaints: 'communication',
    };

    const parentId = parentMap[normalizedId];
    if (parentId && !roleList.includes(parentId)) {
      return false;
    }

    return roleList.includes(normalizedId);
  }

  private normalizeSectionId(sectionId: string): string {
    const clean = (sectionId || '').trim();
    if (clean === 'classes') return 'academics_classes';
    if (clean === 'students') return 'academics_students';
    if (clean === 'alumni') return 'academics_alumni';
    if (clean === 'staff') return 'academics_staff';
    if (clean === 'subjects') return 'academics_subjects';
    if (clean === 'complaints') return 'communication_complaints';
    if (clean === 'notices') return 'communication_notices';
    return clean;
  }

  isServiceEnabled(serviceCode: string): boolean {
    if (this.isSuperAdmin() || this.isSupportSession()) return true;
    const disabled = this.currentUser()?.school?.disabledServices || [];
    if (disabled.includes(serviceCode)) return false;

    const serviceToSectionMap: Record<string, string> = {
      TIMETABLE: 'timetable',
      ATTENDANCE: 'attendance',
      HOMEWORK: 'homework',
      EXAMS: 'exams',
      COMMUNICATION: 'communication',
      COMPLAINTS: 'communication_complaints',
      ACADEMICS: 'academics',
      SUBSCRIPTION: 'subscription',
    };

    const sectionId = serviceToSectionMap[serviceCode.toUpperCase()];
    if (sectionId) {
      return this.isSectionAllowedForUser(sectionId);
    }

    return true;
  }

  /**
   * Get all role permissions for a school
   */
  getSchoolRolePermissions(schoolId?: string): Record<string, string[]> {
    const sId = schoolId || this.currentUser()?.school?.id || 'default';
    try {
      const stored = localStorage.getItem(`${this.ROLE_PERMS_KEY_PREFIX}${sId}`);
      if (stored) {
        return { ...DEFAULT_ROLE_PERMISSIONS, ...JSON.parse(stored) };
      }
    } catch (e) {
      console.warn('Failed to parse stored role permissions', e);
    }
    return JSON.parse(JSON.stringify(DEFAULT_ROLE_PERMISSIONS));
  }

  /**
   * Update role permissions for a role in a school
   */
  saveSchoolRolePermissions(schoolId: string, roleCode: string, sectionIds: string[]): void {
    const current = this.getSchoolRolePermissions(schoolId);
    current[roleCode] = [...sectionIds];

    try {
      localStorage.setItem(`${this.ROLE_PERMS_KEY_PREFIX}${schoolId}`, JSON.stringify(current));
    } catch (e) {
      console.warn('Failed to save role permissions', e);
    }

    this.rolePermissions.set(current);
  }

  /**
   * Reset role permissions for a school/role to defaults
   */
  resetSchoolRolePermissions(schoolId: string, roleCode?: string): void {
    const current = this.getSchoolRolePermissions(schoolId);
    if (roleCode) {
      current[roleCode] = [...(DEFAULT_ROLE_PERMISSIONS[roleCode] || [])];
    } else {
      Object.keys(DEFAULT_ROLE_PERMISSIONS).forEach((r) => {
        current[r] = [...DEFAULT_ROLE_PERMISSIONS[r]];
      });
    }

    try {
      localStorage.setItem(`${this.ROLE_PERMS_KEY_PREFIX}${schoolId}`, JSON.stringify(current));
    } catch (e) {
      console.warn('Failed to reset role permissions', e);
    }

    this.rolePermissions.set(current);
  }

  private loadInitialRolePermissions(): Record<string, string[]> {
    const user = this.getStoredUser();
    const schoolId = user?.school?.id || 'default';
    return this.getSchoolRolePermissions(schoolId);
  }

  constructor() {
    const user = this.currentUser();
    if (user?.school?.id && !user.school.name && !user.school.logoUrl) {
      this.syncSchoolProfileFromDb(user.school.id);
    }
    this.validateStoredSession();
  }

  /**
   * Confirms the locally stored token still exists server-side (sessions are
   * stored and revocable in the database now). Silently clears stale sessions.
   */
  private async validateStoredSession(): Promise<void> {
    const token = localStorage.getItem(this.TOKEN_KEY);
    if (!token) return;
    try {
      const { data, error } = await this.supabase.rpc('whoami');
      if (!error && data && (data as { valid?: boolean }).valid === false) {
        localStorage.removeItem(this.TOKEN_KEY);
        localStorage.removeItem(this.USER_KEY);
        this.currentUser.set(null);
        const publicPaths = ['/', '/features', '/pricing', '/about', '/contact', '/login'];
        if (!publicPaths.some((p) => this.router.url === p || this.router.url.startsWith(p + '?'))) {
          this.router.navigate(['/login']);
        }
      }
    } catch {
      // Network hiccup — keep the local session; subsequent calls decide.
    }
  }

  private syncSchoolProfilePromise = new Map<string, Promise<void>>();

  async syncSchoolProfileFromDb(schoolId?: string): Promise<void> {
    const sId = schoolId || this.currentUser()?.school?.id;
    if (!sId) return;

    if (this.syncSchoolProfilePromise.has(sId)) {
      return this.syncSchoolProfilePromise.get(sId)!;
    }

    const task = (async () => {
      try {
        // 1. Fetch latest record from Supabase
        const { data: school } = await this.supabase
          .from('schools')
          .select('*')
          .eq('id', sId)
          .maybeSingle();

        let metaObj: any = {};
        if (school?.address_line2 && typeof school.address_line2 === 'string' && school.address_line2.startsWith('{')) {
          try {
            metaObj = JSON.parse(school.address_line2);
          } catch {}
        }

        const merged = { ...(school || {}), ...metaObj };
        let logo = merged?.logo_url || merged?.logoUrl;
        let name = merged?.name;
        let code = merged?.code;

        // 2. Also check local profiles cache override
        try {
          const localProfiles = JSON.parse(localStorage.getItem('schoolsense_school_profiles') || '{}');
          if (localProfiles[sId]) {
            const lp = localProfiles[sId];
            logo = lp.logoUrl || lp.logo_url || logo;
            name = lp.name || name;
            code = lp.code || code;
          }
        } catch (e) {}

        if (logo || name || code) {
          this.updateCurrentSchool({
            ...merged,
            name: name || this.currentUser()?.school?.name,
            code: code || this.currentUser()?.school?.code,
            logoUrl: logo,
            logo_url: logo,
          });
        }
      } catch (e) {
        console.warn('syncSchoolProfileFromDb error:', e);
      } finally {
        setTimeout(() => {
          this.syncSchoolProfilePromise.delete(sId);
        }, 10000);
      }
    })();

    this.syncSchoolProfilePromise.set(sId, task);
    return task;
  }

  /** Looks up a school's public profile by its portal subdomain (e.g. "dha"). */
  async getSchoolBySubdomain(subdomain: string): Promise<any> {
    const clean = (subdomain || '').trim().toLowerCase();
    if (!clean) return null;
    try {
      const { data } = await this.supabase
        .from('school_public_profiles')
        .select('id, name, code, city, state, logo_url, affiliation_board, affiliation, motto')
        .eq('subdomain', clean)
        .maybeSingle();
      return data || null;
    } catch {
      return null;
    }
  }

  async getSchoolProfileById(schoolIdOrCode: string): Promise<any> {
    if (!schoolIdOrCode) return null;
    const cleanId = (schoolIdOrCode || '').trim();
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(cleanId);
    let schoolData: any = null;

    try {
      // Public, view-safe columns only — this runs before login.
      let query = this.supabase
        .from('school_public_profiles')
        .select('id, name, code, city, state, logo_url, affiliation_board, affiliation, motto');
      if (isUuid) {
        query = query.eq('id', cleanId);
      } else {
        query = query.ilike('code', cleanId);
      }
      const { data, error } = await query.maybeSingle();
      if (!error && data) {
        schoolData = { ...data };
      } else if (error && !isUuid) {
        const { data: fallbackData } = await this.supabase.from('school_public_profiles').select('id, name, code, city, state, logo_url, affiliation_board, affiliation, motto').ilike('name', `%${cleanId}%`).maybeSingle();
        if (fallbackData) {
          schoolData = { ...fallbackData };
        }
      }
    } catch (e) {
      console.warn('getSchoolProfileById DB error:', e);
    }

    try {
      const localProfiles = JSON.parse(localStorage.getItem('schoolsense_school_profiles') || '{}');
      const lp = localProfiles[cleanId] || (schoolData?.id && localProfiles[schoolData.id]) || (schoolData?.code && localProfiles[schoolData.code]);
      if (lp) {
        schoolData = { ...(schoolData || {}), ...lp };
      }
    } catch (e) {}

    if (schoolData || cleanId) {
      const sName = schoolData?.name || cleanId;
      const sCode = schoolData?.code || cleanId;
      const logo = schoolData?.logoUrl || schoolData?.logo_url || null;

      return {
        ...schoolData,
        name: schoolData?.name || sName,
        code: schoolData?.code || sCode,
        logo_url: logo,
        logoUrl: logo,
        affiliation: schoolData?.affiliation || 'Affiliated to CBSE',
        affiliation_board: schoolData?.affiliation_board || schoolData?.affiliationBoard || 'CBSE',
        affiliationBoard: schoolData?.affiliationBoard || schoolData?.affiliation_board || 'CBSE',
        affiliation_number: schoolData?.affiliation_number || schoolData?.affiliationNumber || '',
        affiliationNumber: schoolData?.affiliationNumber || schoolData?.affiliation_number || '',
        tagline: schoolData?.tagline || schoolData?.motto || '',
        motto: schoolData?.motto || schoolData?.tagline || '',
      };
    }
    return null;
  }

  searchSchools(query: string): Observable<any[]> {
    const q = (query || '').trim();
    if (q.length < 3) {
      return of([]);
    }
    return from(this.fetchSchools(q));
  }

  private async fetchSchools(query: string): Promise<any[]> {
    try {
      let data: any[] | null = null;

      // 1. Try search_schools RPC first
      try {
        const { data: rpcData, error: rpcError } = await this.supabase.rpc('search_schools', { p_query: query });
        if (!rpcError && rpcData && rpcData.length > 0) {
          data = rpcData;
        }
      } catch (e) {}

      // 2. Fallback to full columns from schools table if RPC not present or returned nothing
      if (!data || data.length === 0) {
        const { data: dbData } = await this.supabase
          .from('school_public_profiles')
          .select('*')
          .eq('status', 'ACTIVE')
          .neq('code', 'PLATFORM')
          .ilike('name', `%${query}%`)
          .limit(10);
        data = dbData || [];
      }

      const localProfiles = JSON.parse(localStorage.getItem('schoolsense_school_profiles') || '{}');

      const results = (data || [])
        .filter((s: any) => (s.name || '').toLowerCase().includes(query.toLowerCase()))
        .map((s: any) => {
          let metaObj = {};
          const merged = { ...s };
          const lp = localProfiles[s.id] || localProfiles[s.code] || {};
          const resolvedLogo = lp.logoUrl || lp.logo_url || merged.logo_url || merged.logoUrl || null;

          return {
            ...merged,
            ...lp,
            id: s.id,
            name: lp.name || merged.name,
            code: s.code,
            logo_url: resolvedLogo,
            logoUrl: resolvedLogo,
            address_line1: lp.address || lp.address_line1 || s.address_line1 || '',
            city: lp.city || s.city || '',
            state: lp.state || s.state || '',
            phone: lp.phone || s.phone || '',
            email: lp.email || s.email || '',
            motto: lp.motto || s.motto || merged.motto || '',
            affiliation: lp.affiliation || s.affiliation || merged.affiliation || '',
            affiliation_board: lp.affiliation_board || lp.affiliationBoard || merged.affiliation_board || merged.affiliationBoard || 'CBSE',
            affiliationBoard: lp.affiliationBoard || lp.affiliation_board || merged.affiliationBoard || merged.affiliation_board || 'CBSE',
            affiliation_number: lp.affiliation_number || lp.affiliationNumber || merged.affiliation_number || merged.affiliationNumber || '',
            affiliationNumber: lp.affiliationNumber || lp.affiliation_number || merged.affiliationNumber || merged.affiliation_number || '',
            custom_board_name: lp.custom_board_name || lp.customBoardName || merged.custom_board_name || merged.customBoardName || '',
            customBoardName: lp.customBoardName || lp.custom_board_name || merged.customBoardName || merged.custom_board_name || '',
            tagline: lp.tagline || lp.motto || merged.tagline || merged.motto || '',
          };
        });

      return results;
    } catch (e) {
      console.error('searchSchools error:', e);
      return [];
    }
  }

  getPublicSchools(): Observable<any[]> {
    return of([]);
  }

  async requestPasswordResetOtp(email: string, schoolId: string): Promise<{ success: boolean; message: string; maskedEmail?: string }> {
    // Self-service reset is intentionally disabled: issuing OTPs without an SMS/email
    // provider would mean trusting the client, which is not a security boundary.
    // School admins reset passwords for their own users from the admin panel.
    throw new Error('For your security, password resets are handled by your school. Please contact your school administrator to reset your password.');
  }

  async verifyPasswordResetOtp(email: string, otp: string): Promise<boolean> {
    throw new Error('For your security, password resets are handled by your school administrator.');
  }

  async completePasswordReset(email: string, otp: string, newPassword: string): Promise<{ success: boolean; message: string }> {
    throw new Error('For your security, password resets are handled by your school administrator.');
  }

  login(identifier: string, password: string, schoolCode?: string): Observable<AuthResponse> {
    return from(this.executeLogin(identifier, password, schoolCode)).pipe(
      tap((res) => {
        localStorage.setItem(this.TOKEN_KEY, res.accessToken);
        localStorage.setItem(this.USER_KEY, JSON.stringify(res.user));
        this.supabase.setAuthToken(res.accessToken);
        this.currentUser.set(res.user);
        if (res.user?.school?.id) {
          this.syncSchoolProfileFromDb(res.user.school.id);
        }
      })
    );
  }

  private async executeLogin(identifier: string, password: string, schoolCode?: string): Promise<AuthResponse> {
    const cleanId = identifier.trim();
    const cleanCode = schoolCode?.trim();

    // All authentication is server-verified via the database RPC.
    const { data, error } = await this.supabase.rpc('authenticate_user', {
      p_identifier: cleanId,
      p_password: password,
      p_school_code: cleanCode || null,
    });

    if (error) {
      throw new Error(error.message || 'Invalid email/phone or password.');
    }
    if (!data || !data.accessToken || !data.user) {
      throw new Error('Invalid email/phone or password.');
    }
    return data as AuthResponse;
  }

  fetchProfile(): Observable<User> {
    const current = this.currentUser();
    if (!current) return throwError(() => new Error('Not logged in'));

    return from(
      this.supabase
        .from('users')
        .select('id, email, phone, first_name, last_name, status, last_login_at, created_at, updated_at')
        .eq('id', current.id)
        .single()
    ).pipe(
      map(({ data, error }) => {
        if (error || !data) throw error || new Error('User not found');
        return current;
      })
    );
  }

  updateCurrentSchool(schoolData: any): void {
    const current = this.currentUser();
    if (!current || !current.school) return;
    const logo = schoolData.logoUrl || schoolData.logo_url || current.school.logoUrl || current.school.logo_url;
    const updatedUser: User = {
      ...current,
      school: {
        ...current.school,
        ...schoolData,
        logoUrl: logo,
        logo_url: logo,
      },
    };
    this.currentUser.set(updatedUser);
    try {
      localStorage.setItem(this.USER_KEY, JSON.stringify(updatedUser));
    } catch {}
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
    // 1. Fetch core entities without overly restrictive status filters
    const [schoolsRes, usrRes, usersRes, rolesRes, studentsRes, classesRes, subjectsRes] = await Promise.all([
      this.supabase.from('schools').select('*').neq('code', 'PLATFORM').order('created_at', { ascending: false }),
      this.supabase.from('user_school_roles').select('*'),
      this.supabase.from('users').select('id, email, phone, first_name, last_name, status, created_at'),
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
      if (subsRes?.data && subsRes.data.length > 0) {
        subscriptions = subsRes.data;
        const subsObj: Record<string, any> = {};
        subscriptions.forEach((sb: any) => { subsObj[sb.school_id] = sb; });
        try { localStorage.setItem('schoolsense_saas_subscriptions', JSON.stringify(subsObj)); } catch {}
      }
    } catch {}

    try {
      const walletsRes = await this.supabase.from('school_wallets').select('*');
      if (walletsRes?.data && walletsRes.data.length > 0) {
        wallets = walletsRes.data;
        const walletsObj: Record<string, any> = {};
        wallets.forEach((w: any) => { walletsObj[w.school_id] = w; });
        try { localStorage.setItem('schoolsense_saas_wallets', JSON.stringify(walletsObj)); } catch {}
      }
    } catch {}

    // Read local cache overrides
    let localSubs: Record<string, any> = {};
    let localWallets: Record<string, any> = {};
    let localProfiles: Record<string, any> = {};
    try {
      localSubs = JSON.parse(localStorage.getItem('schoolsense_saas_subscriptions') || '{}');
      localWallets = JSON.parse(localStorage.getItem('schoolsense_saas_wallets') || '{}');
      localProfiles = JSON.parse(localStorage.getItem('schoolsense_school_profiles') || '{}');
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

    const schoolAdminRole = roles.find((r: any) => 
      r.code?.toUpperCase() === 'SCHOOL_ADMIN' || 
      r.code?.toUpperCase() === 'ADMIN' || 
      r.name?.toLowerCase().includes('school admin')
    );

    return schools.map((s: any) => {
      const schoolRoles = usrList.filter((usr: any) => usr.school_id === s.id);
      
      // Step A: Find admin user for this school in user_school_roles
      let adminUser: any = null;
      for (const usr of schoolRoles) {
        const role = roleMap.get(usr.role_id);
        const code = role?.code?.toUpperCase() || '';
        const name = role?.name?.toLowerCase() || '';
        if (code === 'SCHOOL_ADMIN' || code === 'ADMIN' || code === 'PRINCIPAL' || name.includes('admin') || name.includes('principal')) {
          adminUser = userMap.get(usr.user_id);
          if (adminUser) break;
        }
      }

      // Step B: If no admin role found, check any non-student/parent staff assigned to this school
      if (!adminUser && schoolRoles.length > 0) {
        for (const usr of schoolRoles) {
          const role = roleMap.get(usr.role_id);
          const code = role?.code?.toUpperCase() || '';
          if (code !== 'STUDENT' && code !== 'PARENT') {
            adminUser = userMap.get(usr.user_id);
            if (adminUser) break;
          }
        }
      }

      // Step C: Match strictly by exact school email if configured
      if (!adminUser && s.email) {
        const sEmail = s.email.toLowerCase().trim();
        const candidateUser = users.find((u: any) => u.email && u.email.toLowerCase().trim() === sEmail);
        if (candidateUser) {
          adminUser = candidateUser;
        }
      }

      const schoolStudents = students.filter((st: any) => st.school_id === s.id).length;
      const schoolClasses = classes.filter((c: any) => c.school_id === s.id).length;
      const schoolSubjects = subjects.filter((sb: any) => sb.school_id === s.id).length;
      const schoolStaff = schoolRoles.length;

      const sub = subMap.get(s.id) || localSubs[s.id];
      const wallet = walletMap.get(s.id) || localWallets[s.id];
      const localProfile = localProfiles[s.id] || {};
      const resolvedLogo = localProfile.logoUrl || localProfile.logo_url || s.logo_url || s.logoUrl || '';

      return {
        ...s,
        logo_url: resolvedLogo,
        logoUrl: resolvedLogo,
        admin: adminUser
          ? {
              id: adminUser.id,
              fullName: `${adminUser.first_name || ''} ${adminUser.last_name || ''}`.trim() || adminUser.email || 'School Admin',
              firstName: adminUser.first_name || 'School',
              lastName: adminUser.last_name || 'Admin',
              email: adminUser.email,
              phone: adminUser.phone,
              status: adminUser.status || 'ACTIVE',
            }
          : null,
        subscription: {
          perStudentFee: sub?.per_student_fee !== undefined ? Number(sub.per_student_fee) : (sub?.perStudentFee !== undefined ? Number(sub.perStudentFee) : 20.00),
          billingCycle: sub?.billing_cycle || sub?.billingCycle || 'MONTHLY',
          status: sub?.status || 'ACTIVE',
          nextBillingDate: sub?.next_billing_date || sub?.nextBillingDate,
        },
        wallet: {
          balance: wallet?.balance !== undefined ? Number(wallet.balance) : 0.00,
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
    return from(this.executeOnboardSchool(payload));
  }

  private async executeOnboardSchool(payload: any): Promise<any> {
    const cleanName = payload.name.trim();
    const cleanCode = payload.code.trim().toUpperCase();
    const fee = Number(payload.perStudentFee) || 20.00;
    const adminEmail = payload.adminEmail ? payload.adminEmail.trim().toLowerCase() : null;
    const adminFirstName = payload.adminFirstName ? payload.adminFirstName.trim() : 'School';
    const adminLastName = payload.adminLastName ? payload.adminLastName.trim() : 'Admin';
    const adminPhone = payload.adminPhone ? payload.adminPhone.trim() : null;
    const adminPassword = payload.adminPassword || 'password123';

    // 1. Try RPC with 15 arguments (including p_per_student_fee)
    try {
      const { data, error } = await this.supabase.rpc('onboard_school_tenant', {
        p_name: cleanName,
        p_code: cleanCode,
        p_email: payload.email || null,
        p_phone: payload.phone || null,
        p_address_line1: payload.addressLine1 || payload.address_line1 || null,
        p_city: payload.city.trim(),
        p_state: payload.state || null,
        p_country: payload.country || 'India',
        p_postal_code: payload.postalCode || payload.postal_code || null,
        p_admin_first_name: adminFirstName,
        p_admin_last_name: adminLastName,
        p_admin_email: adminEmail,
        p_admin_phone: adminPhone,
        p_admin_password: adminPassword,
        p_per_student_fee: fee,
      });

      if (!error && data) {
        if (adminEmail && (data.schoolId || data.school_id)) {
          await this.ensureSchoolAdminLinked(
            data.schoolId || data.school_id,
            adminEmail,
            adminFirstName,
            adminLastName,
            adminPhone,
            adminPassword
          );
        }
        return data;
      }
    } catch (e) {
      console.warn('15-param RPC failed, attempting 14-param fallback', e);
    }

    // 2. Try RPC with 14 arguments (without p_per_student_fee)
    try {
      const { data, error } = await this.supabase.rpc('onboard_school_tenant', {
        p_name: cleanName,
        p_code: cleanCode,
        p_email: payload.email || null,
        p_phone: payload.phone || null,
        p_address_line1: payload.addressLine1 || payload.address_line1 || null,
        p_city: payload.city.trim(),
        p_state: payload.state || null,
        p_country: payload.country || 'India',
        p_postal_code: payload.postalCode || payload.postal_code || null,
        p_admin_first_name: adminFirstName,
        p_admin_last_name: adminLastName,
        p_admin_email: adminEmail,
        p_admin_phone: adminPhone,
        p_admin_password: adminPassword,
      });

      if (!error && data) {
        const targetSchoolId = data.schoolId || data.school_id;
        if (targetSchoolId) {
          try {
            await this.supabase
              .from('school_subscriptions')
              .update({ per_student_fee: fee })
              .eq('school_id', targetSchoolId);
          } catch {}

          if (adminEmail) {
            await this.ensureSchoolAdminLinked(
              targetSchoolId,
              adminEmail,
              adminFirstName,
              adminLastName,
              adminPhone,
              adminPassword
            );
          }
        }
        return data;
      }
    } catch (e) {
      console.warn('14-param RPC failed, attempting direct database provisioning fallback', e);
    }

    // 3. Direct Client-Side Database Provisioning (Zero-Crash Fallback)
    try {
      // A. Check for duplicate school code
      const { data: existingSchool } = await this.supabase
        .from('schools')
        .select('id')
        .eq('code', cleanCode)
        .maybeSingle();

      if (existingSchool) {
        throw new Error(`A school with code "${cleanCode}" already exists. Please choose a different code.`);
      }

      // B. Create School
      const { data: school, error: sErr } = await this.supabase
        .from('schools')
        .insert({
          name: cleanName,
          code: cleanCode,
          email: payload.email ? payload.email.trim() : null,
          phone: payload.phone ? payload.phone.trim() : null,
          address_line1: payload.addressLine1 || payload.address_line1 || null,
          city: payload.city.trim(),
          state: payload.state ? payload.state.trim() : null,
          country: payload.country || 'India',
          postal_code: payload.postalCode || payload.postal_code || null,
          status: 'ACTIVE',
        })
        .select()
        .single();

      if (sErr) throw sErr;
      const schoolId = school.id;

      // C. Create Academic Session
      try {
        await this.supabase.from('academic_years').insert({
          school_id: schoolId,
          name: '2026–2027',
          start_date: '2026-04-01',
          end_date: '2027-03-31',
          is_current: true,
          status: 'ACTIVE',
        });
      } catch (ayErr) {
        console.warn('Direct academic_years insert warning:', ayErr);
      }

      // D. Create SaaS Subscription & Wallet
      try {
        await this.supabase.from('school_subscriptions').insert({
          school_id: schoolId,
          per_student_fee: fee,
          billing_cycle: 'MONTHLY',
          currency: 'INR',
          status: 'ACTIVE',
          next_billing_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        });
      } catch (subErr) {
        console.warn('Direct school_subscriptions insert warning:', subErr);
      }

      try {
        await this.supabase.from('school_wallets').insert({
          school_id: schoolId,
          balance: 0.00,
          currency: 'INR',
          status: 'ACTIVE',
        });
      } catch (wErr) {
        console.warn('Direct school_wallets insert warning:', wErr);
      }

      // Save local subscription cache
      try {
        const subs = JSON.parse(localStorage.getItem('schoolsense_saas_subscriptions') || '{}');
        subs[schoolId] = {
          school_id: schoolId,
          per_student_fee: fee,
          billing_cycle: 'MONTHLY',
          currency: 'INR',
          status: 'ACTIVE',
          plan: 'ENTERPRISE_MONTHLY',
        };
        localStorage.setItem('schoolsense_saas_subscriptions', JSON.stringify(subs));
      } catch {}

      // E. Create School Admin User & Role Assignment
      if (adminEmail) {
        await this.ensureSchoolAdminLinked(
          schoolId,
          adminEmail,
          adminFirstName,
          adminLastName,
          adminPhone,
          adminPassword
        );
      }

      return {
        success: true,
        schoolId,
        schoolCode: cleanCode,
        schoolName: cleanName,
        perStudentFee: fee,
        adminEmail,
        message: 'School provisioned and onboarded successfully!',
      };
    } catch (directErr: any) {
      console.error('Direct onboarding fallback failed:', directErr);
      throw new Error(directErr.message || 'Failed to onboard school. Please verify code uniqueness.');
    }
  }

  private async ensureSchoolAdminLinked(
    schoolId: string,
    email: string,
    firstName: string,
    lastName: string,
    phone: string | null,
    password: string
  ): Promise<void> {
    try {
      const cleanEmail = email.toLowerCase().trim();
      let userId: string | null = null;
      const { data: existingUser } = await this.supabase
        .from('users')
        .select('id')
        .eq('email', cleanEmail)
        .maybeSingle();

      if (existingUser) {
        userId = existingUser.id;
      } else {
        const { data: newUser } = await this.supabase
          .from('users')
          .insert({
            email: cleanEmail,
            phone: phone ? phone.trim() : null,
            first_name: firstName || 'School',
            last_name: lastName || 'Admin',
            password_hash: password || 'password123',
            status: 'ACTIVE',
          })
          .select('id')
          .maybeSingle();
        userId = newUser?.id || null;
      }

      if (userId) {
        let roleId: string | null = null;
        const { data: roles } = await this.supabase
          .from('roles')
          .select('id')
          .eq('code', 'SCHOOL_ADMIN')
          .limit(1);

        if (roles && roles.length > 0) {
          roleId = roles[0].id;
        } else {
          const { data: newRole } = await this.supabase
            .from('roles')
            .insert({
              name: 'School Admin',
              code: 'SCHOOL_ADMIN',
              description: 'School Principal or Institutional Administrator',
              is_system_role: true,
              status: 'ACTIVE',
            })
            .select('id')
            .maybeSingle();
          roleId = newRole?.id || null;
        }

        if (roleId) {
          const { data: existingRoles } = await this.supabase
            .from('user_school_roles')
            .select('id')
            .eq('user_id', userId)
            .eq('school_id', schoolId)
            .limit(1);

          if (!existingRoles || existingRoles.length === 0) {
            await this.supabase.from('user_school_roles').insert({
              user_id: userId,
              school_id: schoolId,
              role_id: roleId,
              status: 'ACTIVE',
            });
          }
        }
      }
    } catch (e) {
      console.warn('ensureSchoolAdminLinked error:', e);
    }
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
        this.supabase.setAuthToken(res.accessToken);
        this.currentUser.set(res.user);
        if (res.user?.school?.id) {
          this.syncSchoolProfileFromDb(res.user.school.id);
        }
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
        this.supabase.setAuthToken(backup.token);
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
    // Best-effort server-side revocation, then clear the local session.
    try { void this.supabase.rpc('logout_session'); } catch { /* ignore */ }
    this.supabase.setAuthToken(null);
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
      const user = JSON.parse(raw) as User;
      if (user && user.school) {
        try {
          const localProfiles = JSON.parse(localStorage.getItem('schoolsense_school_profiles') || '{}');
          if (user.school.id && localProfiles[user.school.id]) {
            const lp = localProfiles[user.school.id];
            const logo = lp.logoUrl || lp.logo_url || user.school.logoUrl || user.school.logo_url;
            if (logo) {
              user.school.logoUrl = logo;
              user.school.logo_url = logo;
            }
            if (lp.name) user.school.name = lp.name;
            if (lp.code) user.school.code = lp.code;
          }
        } catch {}

        if (user.school.logo_url && !user.school.logoUrl) {
          user.school.logoUrl = user.school.logo_url;
        } else if (user.school.logoUrl && !user.school.logo_url) {
          user.school.logo_url = user.school.logoUrl;
        }
      }
      return user;
    } catch {
      return null;
    }
  }
}
