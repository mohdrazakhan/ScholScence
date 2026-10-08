# SchoolSense (ScholScence) — Project Instructions

India-first, multi-tenant school management SaaS. Tenants = schools. Roles:
`SUPER_ADMIN`/`PLATFORM_ADMIN`, `SCHOOL_ADMIN`, `PRINCIPAL`, `CLASS_TEACHER`, `TEACHER`, `FEE_MANAGER`, `GUARDIAN`/`PARENT`, `STUDENT`.

## Product roadmap (agreed with founder, Oct 2026)

- **Web panel** — the existing Angular app (admin/principal/teacher/parent views). ACTIVE.
- **Two Flutter apps (planned, next phase):**
  - **Parent App** — live student activity feed, push notifications for every activity (daily attendance, marks, results, fines, events, notices), fee invoices/receipts view, complaint raising + status tracking.
  - **Teacher App** — mark attendance, post homework, enter marks, publish notices, receive/reply to parent complaints and change complaint status.
- **Push notifications** — not built yet; plan is FCM. No token storage table or edge function exists yet.
- **Fines** — not in the DB yet; needs a fines table + RPC when app work starts (fee tables exist: `fee_categories`, `fee_structures`, `student_fee_invoices`).
- Complaint status workflow (`complaints` + `complaint_messages`) already exists in DB — teacher/admin monitoring & status changes are partially in the web panel.
- **The marketing website (`frontend/src/app/public/`) is the primary sales tool** — it must present both apps as included in the plan. "Mobile Apps" sections live on Home + Features (`/features#mobile-apps`) + Pricing.

## Architecture — read this before writing code

- **ACTIVE STACK:** `frontend/` (Angular 18 + Tailwind + supabase-js) talks **directly to Supabase** (PostgREST + RPCs + Storage). Supabase project ref: `ayuwznogkbphpqukaoeo`.
- `frontend/src/app/core/services/api.service.ts` is a **REST-shaped facade over Supabase** — it does NOT call the NestJS backend despite its name. All data access goes through it.
- **LEGACY, DO NOT EXTEND:** `backend/` (NestJS + Prisma, port 3000) and `database/*.sql` are the Generation-1 stack, unused since commit `fbb3b1a4` ("migrate backend data layer to Supabase"). Never wire new frontend code to it; `start.sh`'s backend leg is vestigial.
- **Business logic lives in Postgres.** Philosophy: "Zero frontend logic, 100% backend & database controlled" — new logic should be `SECURITY DEFINER` RPCs in `supabase/*.sql`, not client-side aggregation. Exception pattern in use: RPC-first with a JS fallback in `api.service.ts` if the RPC is missing.

## Data model (public schema, shared by all tenants)

- **Tenancy:** every table carries `school_id`. One `schools` row = one tenant. `schools.code = 'PLATFORM'` (`00000000-...-0001`) is the super-admin console pseudo-tenant.
- **Hierarchy:** `schools` → `academic_years` (April–March India sessions, `is_current`) → `classes` (permanent grades, ordered by `display_order` — drives promotion) → `sections` (session-scoped, `capacity`) → `student_enrollments` (UNIQUE student × academic_year; class/section/roll_number) → `students` ↔ `student_guardians` ↔ `guardians` ↔ `users`.
- **Membership:** `user_school_roles` (user × school × role) — a user can hold different roles in different schools.
- **Operational tables:** `attendance` (UNIQUE student+date), `homework` + `homework_submissions`, `exams`, `exam_schedules`, `student_marks`, `timetable_periods`, `notices` + `notice_recipients`, `complaints` + `complaint_messages` (threaded tickets), `school_events`, `fee_categories/structures`, `student_fee_invoices`, `audit_logs`, `student_deactivation_requests` (TC/transfer/promote workflow).
- **Billing:** `school_subscriptions` (default **₹20/student/month**, monthly, INR), `school_wallets` (credit_limit −5000), `wallet_transactions` (immutable ledger). Prorated per-student calculation; billing debits wallet under row lock.

## Auth & security model (rebuilt Oct 2026 — `supabase/security_lockdown.sql`)

- Login = RPC `authenticate_user(p_identifier, p_password, p_school_code)`: email/phone + pgcrypto bcrypt. `school_code='PLATFORM'` → super-admin portal only. Returns an **opaque session token** (`sec_...`) that is now stored (SHA-256 hash) in `app_sessions` with user/school/role and a 30-day expiry.
- **Every data request must carry the token in the `x-schoolsense-token` header.** `SupabaseService.setAuthToken()` rebuilds the Supabase client with that header; `AuthService` calls it on login/logout/support-session enter/exit. The DB resolves the caller via `current_session()` — **never trust client-supplied `school_id`, `role` or `user_id`**.
- Helpers (use inside RPCs & policies): `current_session()`, `current_user_id()`, `current_school_id()`, `current_app_role()`, `is_platform_admin()`, `is_staff_role()`, `parent_can_access_student(uuid)`, `shares_school_with(uuid)`.
- **RLS is now real:** all blanket policies were replaced — school-scoped tables require `school_id = current_school_id()` (or platform admin); parents see only their own children's attendance/marks/fees/enrollments; role assignment + user credential updates are admin-tier (SCHOOL_ADMIN/PRINCIPAL/PLATFORM_ADMIN) only; `password_hash` column is unreadable by client roles.
- **Privileged RPCs are guarded by wrappers:** raw implementations renamed `_*_unsafe` (execute revoked); public names check the session, derive the school server-side, and delegate. When changing these RPCs, edit the `_unsafe` function; the wrapper stays.
- Session RPCs: `whoami()` (used by `AuthService.validateStoredSession()` to self-heal stale tokens), `logout_session()` (revokes server-side).
- **Anonymous-safe surfaces:** `school_public_profiles` view (name/logo/city/board for the login page), plus the `search_schools`, `authenticate_user`, `create_demo_lead` RPCs. Nothing else is anon-readable.
- Password hashing: DB trigger `trg_hash_password_on_insert` fires on INSERT **and UPDATE**; writes of plaintext `password_hash` get bcrypt-hashed automatically — do not add client-side hashing.
- `support_binary_login` requires a platform-admin session (verified server-side), creates a school-scoped support session, audit-logged `SUPPORT_BINARY_LOGIN`.
- **No client-side login fallback exists anymore** — the old direct-table + password-compare path was removed. Self-service password reset is disabled by design (no SMS/email provider): the UI tells users to contact their school admin; admins reset passwords from their session (RLS admin-tier).
- File `supabase/security_lockdown.sql` is the canonical security baseline. Re-running it is idempotent.

## Frontend conventions

- Angular 18 **standalone components with INLINE templates** (no separate `.html` files). Tailwind 3.4 (`primary` = indigo; **Claymorphism** `.clay-*` utilities in `styles.css`). Inter font. `lucide-angular` icons.
- State: **signals in services**; components mostly use plain fields + getters.
- Role branching happens **inside components** via `AuthService` getters (`isAdmin()`, `isParent()`, `isTeacher()`, `isClassTeacher()`...). Permissions: `DEFAULT_ROLE_PERMISSIONS` maps roles → 17 section ids; per-school overrides in `localStorage['schoolsense_role_perms_' + schoolId]`.
- Models in `core/models/index.ts` carry **both snake_case and camelCase fields** (DB passthrough) — keep that duality when changing them.
- Client `school_id` values are for UX only; the database derives the real scope from the session token.
- Route guard: `authGuard` (+ `canActivateChild` on the portal layout); per-feature service gates via `auth.isServiceEnabled('ATTENDANCE' | 'HOMEWORK' | ...)`.
- **localStorage keys in use:** `schoolsense_token`, `schoolsense_user`, `schoolsense_active_session`, `schoolsense_school_profiles`, `schoolsense_saas_subscriptions`, `schoolsense_saas_wallets`, `schoolsense_parent_students`, `schoolsense_root_session`, `schoolsense_role_perms_*`. (`schoolsense_pw_resets` is a dead key — the OTP flow was removed.)
- Dev server: `cd frontend && npm start` → http://localhost:4300. Production build: `npx ng build` (prerenders 12 routes to static HTML — see `prerender-routes.txt`).

## Database changes workflow

- Author SQL in `supabase/*.sql` — one file per feature area, idempotent style (`CREATE OR REPLACE`, `DROP ... IF EXISTS` guards). Pin `set search_path = public, extensions` (pgcrypto lives in `extensions`).
- Apply via the **Supabase MCP server** or the dashboard SQL editor. Never assume a script was applied — verify.
- New RPCs: `SECURITY DEFINER`, `search_path` pinned, return `JSONB`, and **derive caller identity from `current_session()`** — do not accept `school_id`/`role`/`user_id` as trusted inputs. `p_school_id` params stay only for platform-admin use cases (validate before honouring).

## Known security debt — never make worse, fix opportunistically

- Session model is opaque-token-in-header (30-day expiry, revocable via `logout_session`); there is no refresh flow yet, and no rate limiting on login attempts.
- Storage: `school-assets` writes require any valid session (not scoped per school/folder) — tighten when folder conventions exist.
- Parent logins depend on `guardians.user_id` links being populated; unlinked guardian rows mean a parent sees no child data (secure-by-default but worth self-healing).
- Don't add new anon-readable tables/views or client-side password logic; prefer RPCs with `current_session()` checks.

## Watchouts

- Monolith files: `api.service.ts` (~8.4k lines), `features/academics/academics.component.ts` (~10.4k), `layout/main-layout.component.ts` (~2.9k). Keep edits surgical; prefer new files / new RPCs over growing them.
- Performance pattern to copy: `supabase/classes_optimization_rpc.sql` — one summary RPC + lazy per-item detail RPCs (replaced 48+ parallel requests on the Academics page).
- Public website (marketing + blog) lives in `frontend/src/app/public/`: home, features, pricing, about, contact, `blog/` (blog.data.ts holds posts; add new posts there + `prerender-routes.txt` + `public/sitemap.xml`). The contact demo-request form persists to `demo_leads` via `create_demo_lead` RPC.
- Public site SEO rules: use `SeoService.setPage()` per page (title/description/canonical/JSON-LD — it uses the DOCUMENT token so it works during prerender), keep one H1 per page, add new public routes to `prerender-routes.txt`.
