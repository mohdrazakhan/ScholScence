---
name: api-request-signing
description: >-
  Implements, configures, and troubleshoots HMAC-SHA256 request signing, timestamp drift validation,
  and one-time nonce replay protection for SchoolSense APIs (Angular 18 SupabaseService + Supabase Postgres).
  Use this skill whenever implementing anti-Postman / anti-script API security, updating session token
  signing in security_lockdown.sql, or wiring Web Crypto HMAC headers in frontend/src/app/core/services/supabase.service.ts.
---

# SchoolSense API Request Signing & Replay Protection

This skill provides the architecture and step-by-step procedure for locking down SchoolSense's Supabase APIs (`ayuwznogkbphpqukaoeo`) so that requests intercepted from Chrome DevTools cannot be replayed or modified in Postman, `curl`, or custom scripts.

## How the Protection Works

Every authenticated request sent by the SchoolSense Angular client must carry **four cryptographic headers**:

1. `x-schoolsense-token`: The opaque session token (`sec_...`) stored in `public.app_sessions` (as SHA-256 hash).
2. `x-schoolsense-timestamp`: Current Unix epoch timestamp in seconds (e.g., `1760158800`).
3. `x-schoolsense-nonce`: Cryptographically random 128-bit hex/UUID value unique to **one single HTTP request**.
4. `x-schoolsense-signature`: Hex-encoded `HMAC-SHA256` signature calculated over the canonical request string:
   ```text
   <timestamp>.<nonce>.<UPPERCASE_HTTP_METHOD>.<REQUEST_PATH>
   ```
   signed using the session's per-login `signing_secret` (`sig_...`).

### Why Postman & Scripts Fail
- **Copying from Chrome DevTools Network Tab into Postman fails immediately:** The browser already consumed the `x-schoolsense-nonce` when it made the original request. Replaying that exact request in Postman is rejected as a replay attack (`nonce already used`).
- **Changing the nonce or timestamp in Postman fails immediately:** Changing `x-schoolsense-nonce` or `x-schoolsense-timestamp` invalidates `x-schoolsense-signature` unless the caller dynamically computes `HMAC-SHA256` with the session's signing secret inside the 60-second window.
- **Waiting >60 seconds fails immediately:** Postgres rejects any request where `abs(extract(epoch from now()) - timestamp) > 60`.

---

## Implementation Workflow

1. **Read the Architecture Reference**:
   View [supabase-hmac-architecture.md](./references/supabase-hmac-architecture.md) for the exact SQL migrations and Angular Web Crypto `fetch` interceptor implementation.
2. **Database Layer (`supabase/security_lockdown.sql` or `supabase/api_request_signing.sql`)**:
   - Add `signing_secret text` column to `public.app_sessions`.
   - Create `public.api_request_nonces` table to track consumed nonces with automatic expiry cleanup.
   - Create `public.verify_request_signature(p_signing_secret text)` and invoke it inside `public.current_session()`.
   - Update `authenticate_user` and `support_binary_login` to generate and return `signingSecret` (`sig_` + 64 hex chars).
3. **Frontend Layer (`frontend/src/app/core/services/supabase.service.ts` & `auth.service.ts`)**:
   - Store the session's `signingSecret` alongside `schoolsense_token` (or keep in memory/session storage).
   - Provide a custom `global.fetch` function in `SupabaseService.buildClient()` that computes `HMAC-SHA256` via `crypto.subtle` and attaches `x-schoolsense-timestamp`, `x-schoolsense-nonce`, and `x-schoolsense-signature` to every request.
4. **Test & Verify**:
   - Run the helper script [generate-signed-headers.mjs](./scripts/generate-signed-headers.mjs) or use the `schoolsense-api-security` MCP server tools (`generate_hmac_signature`, `simulate_postman_replay_attack`) to verify that unsigned/replayed requests fail while valid signed requests succeed.
