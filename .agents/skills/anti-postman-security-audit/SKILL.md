---
name: anti-postman-security-audit
description: >-
  Audits and tests SchoolSense APIs against Postman, curl, and automated script replay attacks.
  Use this skill to verify that unsigned requests, expired timestamps, replayed nonces, and forged
  HMAC signatures are rejected by Supabase RLS and RPCs.
---

# Anti-Postman & Replay Protection Audit Skill

Use this skill after implementing or updating request signing in SchoolSense to verify that external API clients (Postman, `curl`, Python scripts) cannot replay captured DevTools headers or call protected endpoints without fresh HMAC-SHA256 request signatures.

## Verification Steps

1. **Static Readiness Check**:
   - Use the `schoolsense-api-security` MCP tool `inspect_security_lockdown_status` (or inspect `supabase/` and `frontend/src/app/core/services/supabase.service.ts`) to confirm both database verification and client Web Crypto signing are wired.
2. **Run the Automated Attack Simulator**:
   - Run [simulate-postman-attacks.mjs](./scripts/simulate-postman-attacks.mjs):
     ```bash
     node .agents/skills/anti-postman-security-audit/scripts/simulate-postman-attacks.mjs
     ```
   - Or invoke the `simulate_postman_replay_attack` tool on the `schoolsense-api-security` MCP server.
3. **Evaluate Attack Matrix**:
   Every scenario below must pass:
   - **Scenario 1 (Raw Postman Call — Token Only, No Signature Headers)**: Rejected (`null` session / `401`/`403` or empty RLS result).
   - **Scenario 2 (Expired Timestamp — `timestamp = now - 120s`)**: Rejected even if HMAC signature matches the old timestamp.
   - **Scenario 3 (Future Timestamp — `timestamp = now + 120s`)**: Rejected.
   - **Scenario 4 (Forged Signature — Modified Nonce or Path in Postman)**: Rejected due to HMAC mismatch.
   - **Scenario 5 (DevTools Copy-Paste Replay — Identical Nonce Sent Twice)**: 1st request succeeds; 2nd request with the exact same headers is rejected immediately (`nonce already used`).
