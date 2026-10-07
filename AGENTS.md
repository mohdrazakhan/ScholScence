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

## Auth — fully custom, NOT Supabase Auth

- Login = RPC `authenticate_user(p_identifier, p_password, p_school_code)`: email/phone + pgcrypto bcrypt. `school_code='PLATFORM'` → super-admin portal only; otherwise school portal. Returns an **opaque token** (`sec_...`), not a JWT.
- Client session: `localStorage['schoolsense_token']` + `localStorage['schoolsense_user']` (full user JSON incl. `school`, `children`, `teachingScope`).
- `support_binary_login` = super-admin impersonation of a school admin (audit-logged `SUPPORT_BINARY_LOGIN`).
- Password hashing: DB trigger `trg_hash_password_on_insert` / `set_user_password` (bcrypt, pgcrypto). Any `password_hash` write gets hashed automatically — do not add client-side hashing.
- Parent auto-provisioning fallback exists in `auth.service.ts` (default password `password123`).

## Frontend conventions

- Angular 18 **standalone components with INLINE templates** (no separate `.html` files). Tailwind 3.4 (`primary` = indigo; new **Claymorphism** `.clay-*` utilities in `styles.css`). Inter font. `lucide-angular` icons.
- State: **signals in services**; components mostly use plain fields + getters.
- Role branching happens **inside components** via `AuthService` getters (`isAdmin()`, `isParent()`, `isTeacher()`, `isClassTeacher()`...). Permissions: `DEFAULT_ROLE_PERMISSIONS` maps roles → 17 section ids; per-school overrides in `localStorage['schoolsense_role_perms_' + schoolId]`.
- Models in `core/models/index.ts` carry **both snake_case and camelCase fields** (DB passthrough) — keep that duality when changing them.
- Multi-tenancy is client-assembled: `auth.getSchoolId()` reads the school from localStorage; pass `school_id` into every query/RPC.
- Route guard: `authGuard` (+ `canActivateChild` on the portal layout); per-feature service gates via `auth.isServiceEnabled('ATTENDANCE' | 'HOMEWORK' | ...)`.
- **localStorage keys in use:** `schoolsense_token`, `schoolsense_user`, `schoolsense_active_session`, `schoolsense_school_profiles`, `schoolsense_saas_subscriptions`, `schoolsense_saas_wallets`, `schoolsense_parent_students`, `schoolsense_pw_resets`, `schoolsense_root_session`, `schoolsense_role_perms_*`.
- Dev server: `cd frontend && npm start` → http://localhost:4300.

## Database changes workflow

- Author SQL in `supabase/*.sql` — one file per feature area, idempotent style (`CREATE OR REPLACE`, `DROP ... IF EXISTS` guards).
- Apply via the **Supabase MCP server** (`execute_sql`) or the Supabase dashboard SQL editor. Never assume a script was applied — verify.
- New RPCs: `SECURITY DEFINER`, `search_path` pinned, accept explicit `school_id` params, return `JSONB`, and do role/portal checks **inside** the function.

## Known security debt — never make worse, fix opportunistically

- **RLS is effectively open:** blanket `USING (true)` policies exist, and the `auth.uid()`-based policies can never match because login uses opaque tokens (not Supabase Auth sessions). Security rests on RPC-internal checks + client-side scoping.
- `auth.service.ts` has a fallback login that queries `users` directly and compares passwords **client-side**; password-reset OTPs live in localStorage.
- Don't add new public/anon-readable paths or new client-side password logic; prefer RPCs with internal role checks.

## Watchouts

- Monolith files: `api.service.ts` (~8.4k lines), `features/academics/academics.component.ts` (~10.4k), `layout/main-layout.component.ts` (~2.9k). Keep edits surgical; prefer new files / new RPCs over growing them.
- Performance pattern to copy: `supabase/classes_optimization_rpc.sql` — one summary RPC + lazy per-item detail RPCs (replaced 48+ parallel requests on the Academics page).
- Public marketing pages live in `frontend/src/app/public/` (untracked/WIP): home, features, pricing, about, contact. The contact demo-request form is UI-only — no lead persistence yet.
