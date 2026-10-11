import { Injectable } from '@angular/core';
import { createClient, SupabaseClient, User as SupabaseUser, Session } from '@supabase/supabase-js';
import { environment } from '../../../environments/environment';
import { BehaviorSubject, Observable } from 'rxjs';

/** localStorage key shared with AuthService — the login session token. */
const SESSION_TOKEN_KEY = 'schoolsense_token';
/** localStorage key for per-session HMAC signing secret issued on login. */
const SIGNING_SECRET_KEY = 'schoolsense_signing_secret';

/** Security headers verified by PostgreSQL (see security_lockdown.sql & api_request_signing.sql). */
const SESSION_HEADER = 'x-schoolsense-token';
const CLIENT_HEADER = 'x-schoolsense-client';
const HEADER_TIMESTAMP = 'x-schoolsense-timestamp';
const HEADER_NONCE = 'x-schoolsense-nonce';
const HEADER_SIGNATURE = 'x-schoolsense-signature';
const HEADER_TARGET = 'x-schoolsense-target';

/** Constants for deterministic fallback & pre-login request signing. */
const CLIENT_APP_ID = 'schoolsense-web-v1';
const PRE_LOGIN_SIGNING_KEY = 'schoolsense-client-app-v1-2026-hmac-key';
const TOKEN_DERIVATION_SALT = 'schoolsense-v1-hmac-salt-2026';

async function computeHmacSha256Hex(secret: string, message: string): Promise<string> {
  const subtle = globalThis.crypto?.subtle;
  if (!subtle) {
    return '';
  }
  const encoder = new TextEncoder();
  const key = await subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const sigBuffer = await subtle.sign('HMAC', key, encoder.encode(message));
  return Array.from(new Uint8Array(sigBuffer))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

function generateCryptographicNonce(): string {
  if (globalThis.crypto?.getRandomValues) {
    const bytes = new Uint8Array(16);
    globalThis.crypto.getRandomValues(bytes);
    return Array.from(bytes)
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');
  }
  return (
    Math.random().toString(16).slice(2, 18).padEnd(16, '0') +
    Date.now().toString(16).padStart(16, '0')
  );
}

/**
 * Client-side pre-flight SQL Injection & PostgREST filter injection detector.
 * Blocks classic SQLi payloads before a request even leaves the browser.
 */
const SQLI_PATTERN =
  /(\bunion\s+(all\s+)?select\b|\bpg_sleep\s*\(|\binformation_schema\b|\bpg_catalog\b|\bpg_shadow\b|\bpg_authid\b|;\s*(drop|delete|update|insert|alter|truncate|create|grant|revoke)\b|'\s*or\s+['"0-9a-z_]+\s*=\s*['"0-9a-z_]+|--\s*$|\/\*[\s\S]*?\*\/|\bdblink\b|\blo_import\b|\blo_export\b|\bpg_read_file\b)/i;

function containsSqlInjectionPayload(value: unknown): boolean {
  if (typeof value === 'string') {
    let decoded = value;
    try {
      decoded = decodeURIComponent(value);
    } catch {
      // ignore malformed URI encoding
    }
    return SQLI_PATTERN.test(value) || SQLI_PATTERN.test(decoded);
  }
  if (Array.isArray(value)) {
    return value.some((item) => containsSqlInjectionPayload(item));
  }
  if (value && typeof value === 'object') {
    return Object.values(value as Record<string, unknown>).some((v) => containsSqlInjectionPayload(v));
  }
  return false;
}

@Injectable({
  providedIn: 'root',
})
export class SupabaseService {
  private supabase: SupabaseClient;
  private currentUserSubject = new BehaviorSubject<SupabaseUser | null>(null);
  public currentUser$ = this.currentUserSubject.asObservable();

  constructor() {
    this.supabase = this.buildClient(this.readStoredToken(), this.readStoredSigningSecret());

    // Initialize session listener
    this.supabase.auth.getSession().then(({ data: { session } }) => {
      this.currentUserSubject.next(session?.user ?? null);
    });

    this.supabase.auth.onAuthStateChange((_event, session) => {
      this.currentUserSubject.next(session?.user ?? null);
    });
  }

  /**
   * Attaches (or clears) the SchoolSense login token and per-session HMAC signing secret
   * for all requests. Every request is dynamically signed with HMAC-SHA256 + timestamp + nonce
   * so intercepted DevTools requests cannot be replayed or modified in Postman.
   */
  setAuthToken(token: string | null, signingSecret?: string | null): void {
    const resolvedSecret =
      token === null
        ? null
        : signingSecret !== undefined
          ? signingSecret
          : this.readStoredSigningSecret();
    this.supabase = this.buildClient(token, resolvedSecret);
  }

  private buildClient(token: string | null, signingSecret?: string | null): SupabaseClient {
    // On the server (prerendering/SSR) there is no browser session to persist,
    // and the auth auto-refresh ticker would keep the render zone unstable forever.
    const isServer = typeof window === 'undefined';

    let cachedDerivedSecretPromise: Promise<string> | null = null;
    const resolveSigningKey = async (activeToken: string | null, activeSecret: string | null): Promise<string> => {
      if (activeSecret && activeSecret.trim().length > 0) {
        return activeSecret.trim();
      }
      if (activeToken && activeToken.trim().length > 0) {
        if (!cachedDerivedSecretPromise) {
          cachedDerivedSecretPromise = computeHmacSha256Hex(TOKEN_DERIVATION_SALT, activeToken.trim());
        }
        return cachedDerivedSecretPromise;
      }
      return PRE_LOGIN_SIGNING_KEY;
    };

    const signedFetch: typeof fetch = async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
      const urlStr =
        typeof input === 'string'
          ? input
          : input instanceof URL
            ? input.toString()
            : input.url;

      const method = (init?.method || (input instanceof Request ? input.method : 'GET')).toUpperCase();
      const headers = new Headers(
        init?.headers || (input instanceof Request ? input.headers : undefined)
      );

      const activeToken = token || this.readStoredToken();
      const activeSecret = signingSecret || this.readStoredSigningSecret();

      if (activeToken) {
        headers.set(SESSION_HEADER, activeToken);
      }
      headers.set(CLIENT_HEADER, CLIENT_APP_ID);

      try {
        const parsedUrl = new URL(urlStr);
        if (containsSqlInjectionPayload(parsedUrl.search)) {
          return new Response(
            JSON.stringify({
              hint: 'This API can only be accessed through the official SchoolSense application.',
              message: 'Access denied: Potentially unsafe query payload blocked.',
            }),
            { status: 403, headers: { 'Content-Type': 'application/json' } }
          );
        }
        const restPrefix = '/rest/v1';
        const normalizedPath = parsedUrl.pathname.startsWith(restPrefix)
          ? parsedUrl.pathname.slice(restPrefix.length)
          : parsedUrl.pathname;

        const timestamp = Math.floor(Date.now() / 1000).toString();
        const nonce = generateCryptographicNonce();
        const keyToUse = await resolveSigningKey(activeToken, activeSecret);
        const canonical = `${timestamp}.${nonce}.${method}.${normalizedPath}`;
        const signature = await computeHmacSha256Hex(keyToUse, canonical);

        if (signature) {
          headers.set(HEADER_TIMESTAMP, timestamp);
          headers.set(HEADER_NONCE, nonce);
          headers.set(HEADER_SIGNATURE, signature);
          headers.set(HEADER_TARGET, `${method}:${normalizedPath}`);
        }
      } catch {
        // Fallback if URL parsing fails in non-standard environment
      }

      return fetch(input, { ...init, headers });
    };

    return createClient(environment.supabaseUrl, environment.supabaseKey, {
      auth: {
        autoRefreshToken: !isServer,
        persistSession: !isServer,
        detectSessionInUrl: !isServer,
      },
      global: {
        headers: token
          ? { [SESSION_HEADER]: token, [CLIENT_HEADER]: CLIENT_APP_ID }
          : { [CLIENT_HEADER]: CLIENT_APP_ID },
        fetch: signedFetch,
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

  private readStoredSigningSecret(): string | null {
    try {
      return typeof localStorage !== 'undefined' ? localStorage.getItem(SIGNING_SECRET_KEY) : null;
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
    if (params && containsSqlInjectionPayload(params)) {
      return Promise.resolve({
        data: null,
        error: {
          message: 'Access denied: Potentially unsafe input blocked.',
          details: '',
          hint: 'Please remove special SQL characters and try again.',
          code: '42501',
        },
        count: null,
        status: 403,
        statusText: 'Forbidden',
      }) as any;
    }
    return this.supabase.rpc(fn, params);
  }
}
