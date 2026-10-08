import { Injectable } from '@angular/core';
import { createClient, SupabaseClient, User as SupabaseUser, Session } from '@supabase/supabase-js';
import { environment } from '../../../environments/environment';
import { BehaviorSubject, Observable } from 'rxjs';

/** localStorage key shared with AuthService — the login session token. */
const SESSION_TOKEN_KEY = 'schoolsense_token';
/** Header the database uses to resolve the caller's school/role (see security_lockdown.sql). */
const SESSION_HEADER = 'x-schoolsense-token';

@Injectable({
  providedIn: 'root',
})
export class SupabaseService {
  private supabase: SupabaseClient;
  private currentUserSubject = new BehaviorSubject<SupabaseUser | null>(null);
  public currentUser$ = this.currentUserSubject.asObservable();

  constructor() {
    this.supabase = this.buildClient(this.readStoredToken());

    // Initialize session listener
    this.supabase.auth.getSession().then(({ data: { session } }) => {
      this.currentUserSubject.next(session?.user ?? null);
    });

    this.supabase.auth.onAuthStateChange((_event, session) => {
      this.currentUserSubject.next(session?.user ?? null);
    });
  }

  /**
   * Attaches (or clears) the SchoolSense login token for all requests.
   * The database resolves the caller's identity — school, role, user — from the
   * `x-schoolsense-token` header; nothing else the client sends is trusted.
   */
  setAuthToken(token: string | null): void {
    this.supabase = this.buildClient(token);
  }

  private buildClient(token: string | null): SupabaseClient {
    // On the server (prerendering/SSR) there is no browser session to persist,
    // and the auth auto-refresh ticker would keep the render zone unstable forever.
    const isServer = typeof window === 'undefined';

    return createClient(environment.supabaseUrl, environment.supabaseKey, {
      auth: {
        autoRefreshToken: !isServer,
        persistSession: !isServer,
        detectSessionInUrl: !isServer,
      },
      global: {
        headers: token ? { [SESSION_HEADER]: token } : {},
      },
    });
  }

  private readStoredToken(): string | null {
    try {
      return typeof localStorage !== 'undefined' ? localStorage.getItem(SESSION_TOKEN_KEY) : null;
    } catch {
      return null;
    }
  }

  get client(): SupabaseClient {
    return this.supabase;
  }

  get auth() {
    return this.supabase.auth;
  }

  get storage() {
    return this.supabase.storage;
  }

  from(table: string) {
    return this.supabase.from(table);
  }

  rpc(fn: string, params?: any) {
    return this.supabase.rpc(fn, params);
  }
}
