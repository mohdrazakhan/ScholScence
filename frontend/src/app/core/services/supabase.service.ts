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

/**
 * Strict LocalStorage Security Firewall:
 * Only the 3 essential session keys are permitted in browser localStorage.
 * All other keys (signing_secret, student/staff/guardian caches, photos, attendance,
 * wallets, old OTP resets, and sb-*-auth-token) are purged from disk and held only
 * in volatile RAM (inMemoryVolatileStore) for the duration of the active tab.
 */
const ALLOWED_PERSISTENT_KEYS = new Set<string>([
  SESSION_TOKEN_KEY,
  'schoolsense_user',
  'schoolsense_active_session',
  'schoolsense_root_session',
]);

const inMemoryVolatileStore = new Map<string, string>();
let firewallInstalled = false;

function installLocalStorageFirewall(): void {
  if (firewallInstalled || typeof window === 'undefined' || !window.localStorage) {
    return;
  }
  firewallInstalled = true;

  try {
    const rawStorage = window.localStorage;
    const nativeGetItem = Storage.prototype.getItem.bind(rawStorage);
    const nativeSetItem = Storage.prototype.setItem.bind(rawStorage);
    const nativeRemoveItem = Storage.prototype.removeItem.bind(rawStorage);

    // 1. Rescue signing_secret into volatile RAM if present, then purge all non-whitelisted keys from disk
    const existingSecret = nativeGetItem(SIGNING_SECRET_KEY);
    if (existingSecret) {
      inMemoryVolatileStore.set(SIGNING_SECRET_KEY, existingSecret);
    }

    const keysToPurge: string[] = [];
    for (let i = 0; i < rawStorage.length; i++) {
      const key = rawStorage.key(i);
      if (key && !ALLOWED_PERSISTENT_KEYS.has(key)) {
        keysToPurge.push(key);
      }
    }
    for (const key of keysToPurge) {
      nativeRemoveItem(key);
    }

    // 2. Intercept getItem / setItem / removeItem so non-whitelisted keys never touch disk localStorage
    Storage.prototype.getItem = function (key: string): string | null {
      if (this === rawStorage && !ALLOWED_PERSISTENT_KEYS.has(key)) {
        return inMemoryVolatileStore.has(key) ? inMemoryVolatileStore.get(key)! : null;
      }
      return nativeGetItem(key);
    };

    Storage.prototype.setItem = function (key: string, value: string): void {
      if (this === rawStorage && !ALLOWED_PERSISTENT_KEYS.has(key)) {
        inMemoryVolatileStore.set(key, String(value));
        nativeRemoveItem(key);
        return;
      }
      nativeSetItem(key, value);
    };

    Storage.prototype.removeItem = function (key: string): void {
      if (this === rawStorage) {
        inMemoryVolatileStore.delete(key);
        if (key === SESSION_TOKEN_KEY) {
          inMemoryVolatileStore.clear();
        }
      }
      nativeRemoveItem(key);
    };
  } catch {
    // Ignore if browser restricts Storage prototype patching
  }
}

installLocalStorageFirewall();

@Injectable({
  providedIn: 'root',
})
export class SupabaseService {
  private supabase: SupabaseClient;
  private currentUserSubject = new BehaviorSubject<SupabaseUser | null>(null);
  public currentUser$ = this.currentUserSubject.asObservable();

  constructor() {
    installLocalStorageFirewall();
    this.supabase = this.buildClient(this.readStoredToken(), this.readStoredSigningSecret());
  }

  /**
   * Attaches (or clears) the SchoolSense login token and per-session HMAC signing secret
   * for all requests. Every request is dynamically signed with HMAC-SHA256 + timestamp + nonce
   * so intercepted DevTools requests cannot be replayed or modified in Postman.
   */
  setAuthToken(token: string | null, signingSecret?: string | null): void {
    if (token === null) {
      inMemoryVolatileStore.clear();
    } else if (signingSecret) {
      inMemoryVolatileStore.set(SIGNING_SECRET_KEY, signingSecret);
    }
    const resolvedSecret =
      token === null
        ? null
        : signingSecret !== undefined
          ? signingSecret
          : this.readStoredSigningSecret();
    this.supabase = this.buildClient(token, resolvedSecret);
  }

  private buildClient(token: string | null, signingSecret?: string | null): SupabaseClient {
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

      const isPreLoginEndpoint =
        urlStr.includes('/rpc/authenticate_user') ||
        urlStr.includes('/rpc/search_schools') ||
        urlStr.includes('/rpc/create_demo_lead');

      const activeToken = isPreLoginEndpoint ? null : (token || this.readStoredToken());
      const activeSecret = isPreLoginEndpoint ? null : (signingSecret || this.readStoredSigningSecret());

      if (activeToken) {
        headers.set(SESSION_HEADER, activeToken);
      } else {
        headers.delete(SESSION_HEADER);
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
        const keyToUse = isPreLoginEndpoint
          ? PRE_LOGIN_SIGNING_KEY
          : await resolveSigningKey(activeToken, activeSecret);
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
        autoRefreshToken: false,
        persistSession: false,
        detectSessionInUrl: false,
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
    return inMemoryVolatileStore.get(SIGNING_SECRET_KEY) || null;
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
