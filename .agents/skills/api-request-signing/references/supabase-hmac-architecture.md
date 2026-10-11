# Supabase + Angular 18 HMAC Request Signing Reference

## 1. PostgreSQL Schema & Verification (`supabase/api_request_signing.sql`)

```sql
-- 1. Add signing_secret to app_sessions
alter table public.app_sessions
  add column if not exists signing_secret text;

-- 2. Nonce store to prevent Postman copy-paste replay within the 60s timestamp window
create unlogged table if not exists public.api_request_nonces (
  nonce_hash text primary key,
  session_id uuid not null references public.app_sessions(id) on delete cascade,
  created_at timestamptz not null default now()
);

create index if not exists idx_api_request_nonces_created_at
  on public.api_request_nonces(created_at);

alter table public.api_request_nonces enable row level security;
revoke all on public.api_request_nonces from anon, authenticated;

-- 3. Signature & Replay Verification Helper
create or replace function public.verify_request_signature(
  p_session_id uuid,
  p_signing_secret text
)
returns boolean
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_headers   jsonb;
  v_ts_text   text;
  v_ts        bigint;
  v_now       bigint;
  v_nonce     text;
  v_sig       text;
  v_method    text;
  v_path      text;
  v_canonical text;
  v_expected  text;
  v_nonce_key text;
begin
  -- Backward compatibility if session has no signing_secret (during rollout)
  if p_signing_secret is null or p_signing_secret = '' then
    return false;
  end if;

  v_headers := coalesce(current_setting('request.headers', true), '{}')::jsonb;
  v_ts_text := v_headers ->> 'x-schoolsense-timestamp';
  v_nonce   := v_headers ->> 'x-schoolsense-nonce';
  v_sig     := v_headers ->> 'x-schoolsense-signature';

  if v_ts_text is null or v_nonce is null or v_sig is null then
    return false;
  end if;

  if length(v_nonce) < 16 or length(v_nonce) > 128 then
    return false;
  end if;

  -- Validate timestamp format and ±60 second window
  begin
    v_ts := v_ts_text::bigint;
  exception when others then
    return false;
  end;

  v_now := extract(epoch from clock_timestamp())::bigint;
  if abs(v_now - v_ts) > 60 then
    return false;
  end if;

  -- Extract PostgREST request method and path
  v_method := upper(coalesce(current_setting('request.method', true), 'GET'));
  v_path   := coalesce(current_setting('request.path', true), '');

  -- Canonical string: <timestamp>.<nonce>.<METHOD>.<path>
  v_canonical := v_ts_text || '.' || v_nonce || '.' || v_method || '.' || v_path;
  v_expected  := encode(hmac(v_canonical, p_signing_secret, 'sha256'), 'hex');

  -- Constant-time length + equality check
  if length(v_sig) != length(v_expected) or lower(v_sig) != v_expected then
    return false;
  end if;

  -- Check and record single-use nonce (blocks Postman replay of DevTools network requests)
  v_nonce_key := encode(digest(p_session_id::text || ':' || v_nonce, 'sha256'), 'hex');

  -- Opportunistic cleanup of expired nonces (> 2 minutes old)
  delete from public.api_request_nonces
   where created_at < clock_timestamp() - interval '2 minutes';

  begin
    insert into public.api_request_nonces (nonce_hash, session_id, created_at)
    values (v_nonce_key, p_session_id, clock_timestamp());
  exception when unique_violation then
    -- Nonce was already consumed! Reject replay attack.
    return false;
  end;

  return true;
end;
$$;

revoke all on function public.verify_request_signature(uuid, text) from public, anon, authenticated;
```

---

## 2. Angular `SupabaseService` Custom Fetch (`frontend/src/app/core/services/supabase.service.ts`)

```typescript
const SIGNING_SECRET_KEY = 'schoolsense_signing_secret';
const HEADER_TIMESTAMP = 'x-schoolsense-timestamp';
const HEADER_NONCE = 'x-schoolsense-nonce';
const HEADER_SIGNATURE = 'x-schoolsense-signature';

async function computeHmacSha256Hex(secret: string, message: string): Promise<string> {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    enc.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const sigBuffer = await crypto.subtle.sign('HMAC', key, enc.encode(message));
  return Array.from(new Uint8Array(sigBuffer))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

function createSignedFetch(token: string | null, signingSecret: string | null): typeof fetch {
  return async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
    const urlStr = typeof input === 'string' ? input : input instanceof URL ? input.toString() : input.url;
    const parsedUrl = new URL(urlStr);
    const method = (init?.method || (input instanceof Request ? input.method : 'GET')).toUpperCase();

    // PostgREST sees the path after /rest/v1 (e.g. /rpc/whoami or /students)
    const restPrefix = '/rest/v1';
    const postgrestPath = parsedUrl.pathname.startsWith(restPrefix)
      ? parsedUrl.pathname.slice(restPrefix.length)
      : parsedUrl.pathname;

    const headers = new Headers(init?.headers || (input instanceof Request ? input.headers : undefined));

    if (token) {
      headers.set('x-schoolsense-token', token);
    }

    if (signingSecret && typeof crypto !== 'undefined' && crypto.subtle) {
      const timestamp = Math.floor(Date.now() / 1000).toString();
      const nonce = crypto.randomUUID().replace(/-/g, '') + Math.random().toString(16).slice(2, 10);
      const canonical = `${timestamp}.${nonce}.${method}.${postgrestPath}`;
      const signature = await computeHmacSha256Hex(signingSecret, canonical);

      headers.set(HEADER_TIMESTAMP, timestamp);
      headers.set(HEADER_NONCE, nonce);
      headers.set(HEADER_SIGNATURE, signature);
    }

    return fetch(input, { ...init, headers });
  };
}
```
