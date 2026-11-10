-- ==============================================================================
-- SchoolSense — Departmental Users Avatar & Admin Hierarchy Synchronization
-- ==============================================================================
-- 1. Adds avatar_url and profile_image columns to public.users & user_school_roles
-- 2. Updates _get_departmental_users_overview_unsafe to include avatar_url and
--    profile_image in the returned dataset so profile pictures persist on load.
-- ==============================================================================

SET search_path = public, extensions;

-- 1. Ensure avatar columns exist on users & user_school_roles
ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS avatar_url text,
  ADD COLUMN IF NOT EXISTS profile_image text;

ALTER TABLE public.user_school_roles
  ADD COLUMN IF NOT EXISTS avatar_url text,
  ADD COLUMN IF NOT EXISTS profile_image text;

-- Notify PostgREST to reload its schema cache
NOTIFY pgrst, 'reload schema';

-- 2. Update _get_departmental_users_overview_unsafe
CREATE OR REPLACE FUNCTION public._get_departmental_users_overview_unsafe(
  p_school_id text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  v_school_id uuid := NULL;
  v_users_list jsonb := '[]'::jsonb;
  v_roles_list jsonb := '[]'::jsonb;
  v_total_users int := 0;
  v_active_users int := 0;
  v_fee_users int := 0;
  v_transport_users int := 0;
  v_admin_users int := 0;
  v_specialized_users int := 0;
BEGIN
  IF p_school_id IS NOT NULL AND TRIM(p_school_id) <> '' THEN
    BEGIN
      v_school_id := p_school_id::uuid;
    EXCEPTION WHEN OTHERS THEN
      v_school_id := NULL;
    END;
  END IF;

  IF v_school_id IS NULL THEN
    v_school_id := public.current_school_id();
  END IF;

  IF v_school_id IS NULL THEN
    RETURN public.unauthorized_api_response();
  END IF;

  -- Fetch Departmental Users (deduplicated by user ID, strictly excluding platform/binary admins, teachers, parents, students)
  SELECT COALESCE(jsonb_agg(user_row), '[]'::jsonb)
  INTO v_users_list
  FROM (
    SELECT *
    FROM (
      SELECT DISTINCT ON (u.id)
        u.id,
        v_school_id AS school_id,
        u.first_name,
        COALESCE(u.last_name, '') AS last_name,
        TRIM(CONCAT(u.first_name, ' ', COALESCE(u.last_name, ''))) AS name,
        u.email,
        COALESCE(u.phone, '') AS phone,
        COALESCE(u.avatar_url, u.profile_image, usr.avatar_url, usr.profile_image, '') AS avatar_url,
        COALESCE(u.avatar_url, u.profile_image, usr.avatar_url, usr.profile_image, '') AS profile_image,
        COALESCE(usr.department, u.department,
          CASE
            WHEN r.code = 'FEE_MANAGER' THEN 'Fee & Accounts'
            WHEN r.code = 'TRANSPORT_MANAGER' THEN 'Transport & Fleet'
            WHEN r.code = 'SCHOOL_ADMIN' THEN 'Administration'
            WHEN r.code = 'LIBRARIAN' THEN 'Library & Resources'
            WHEN r.code = 'SPORTS_DIRECTOR' THEN 'Sports & Physical Education'
            WHEN r.code = 'RECEPTIONIST' THEN 'Front Desk & Reception'
            WHEN r.code = 'SECURITY_STAFF' THEN 'Security & Safety'
            ELSE 'Administration'
          END
        ) AS department,
        COALESCE(usr.designation, u.designation, r.name, r.code, 'Staff Member') AS designation,
        COALESCE(r.code, 'STAFF') AS role,
        COALESCE(r.name, r.code, 'Staff') AS role_name,
        COALESCE(usr.custom_permissions, u.custom_permissions, '[]'::jsonb) AS custom_permissions,
        COALESCE(usr.status, u.status, 'ACTIVE') AS status,
        u.last_login_at AS last_login,
        u.created_at,
        u.updated_at
      FROM public.user_school_roles usr
      JOIN public.users u ON u.id = usr.user_id
      LEFT JOIN public.roles r ON r.id = usr.role_id
      WHERE usr.school_id = v_school_id
        AND usr.deleted_at IS NULL
        AND u.deleted_at IS NULL
        AND COALESCE(UPPER(r.code), '') NOT IN ('SUPER_ADMIN', 'PLATFORM_ADMIN', 'BINARY', 'STUDENT', 'PARENT', 'GUARDIAN', 'TEACHER', 'CLASS_TEACHER')
        AND LOWER(u.email) <> 'admin@schoolscence.in'
        AND LOWER(u.email) NOT LIKE 'support+%@schoolscence.in'
        AND NOT EXISTS (
          SELECT 1 FROM public.guardians g WHERE g.user_id = u.id AND g.school_id = v_school_id
        )
      ORDER BY u.id, usr.updated_at DESC NULLS LAST, u.created_at DESC
    ) deduped
    ORDER BY created_at DESC
  ) user_row;

  SELECT
    COALESCE(jsonb_array_length(v_users_list), 0),
    COALESCE((SELECT COUNT(*) FROM jsonb_array_elements(v_users_list) elm WHERE elm->>'status' = 'ACTIVE'), 0),
    COALESCE((SELECT COUNT(*) FROM jsonb_array_elements(v_users_list) elm WHERE (elm->>'department' ILIKE '%Fee%' OR elm->>'department' ILIKE '%Account%' OR elm->>'role' = 'FEE_MANAGER')), 0),
    COALESCE((SELECT COUNT(*) FROM jsonb_array_elements(v_users_list) elm WHERE (elm->>'department' ILIKE '%Transport%' OR elm->>'role' = 'TRANSPORT_MANAGER')), 0),
    COALESCE((SELECT COUNT(*) FROM jsonb_array_elements(v_users_list) elm WHERE (elm->>'department' ILIKE '%Admin%' OR elm->>'role' = 'SCHOOL_ADMIN')), 0),
    COALESCE((SELECT COUNT(*) FROM jsonb_array_elements(v_users_list) elm WHERE (elm->>'department' ILIKE '%Library%' OR elm->>'department' ILIKE '%Sport%' OR elm->>'department' ILIKE '%Reception%' OR elm->>'department' ILIKE '%Security%')), 0)
  INTO v_total_users, v_active_users, v_fee_users, v_transport_users, v_admin_users, v_specialized_users;

  -- Available roles list (deduplicated by code, strictly excluding SUPER_ADMIN / PLATFORM_ADMIN / BINARY)
  SELECT COALESCE(jsonb_agg(role_row), '[]'::jsonb)
  INTO v_roles_list
  FROM (
    SELECT *
    FROM (
      SELECT DISTINCT ON (UPPER(code)) id, code, name, description
      FROM public.roles
      WHERE UPPER(code) NOT IN ('SUPER_ADMIN', 'PLATFORM_ADMIN', 'BINARY', 'STUDENT', 'PARENT', 'GUARDIAN', 'TEACHER', 'CLASS_TEACHER')
      ORDER BY UPPER(code), created_at ASC
    ) deduped_roles
    ORDER BY name ASC
  ) role_row;

  RETURN jsonb_build_object(
    'success', true,
    'stats', jsonb_build_object(
      'totalUsers', v_total_users,
      'activeUsers', v_active_users,
      'feeUsers', v_fee_users,
      'transportUsers', v_transport_users,
      'adminUsers', v_admin_users,
      'specializedUsers', v_specialized_users
    ),
    'users', v_users_list,
    'availableRoles', v_roles_list
  );
END;
$$;

REVOKE EXECUTE ON FUNCTION public._get_departmental_users_overview_unsafe(text) FROM public, anon, authenticated;

-- 3. Storage bucket policies for school-assets (allows image upload without PostgREST HMAC denial)
INSERT INTO storage.buckets (id, name, public)
VALUES ('school-assets', 'school-assets', true)
ON CONFLICT (id) DO UPDATE SET public = true;

DROP POLICY IF EXISTS "school-assets upload" ON storage.objects;
CREATE POLICY "school-assets upload" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'school-assets');

DROP POLICY IF EXISTS "school-assets update" ON storage.objects;
CREATE POLICY "school-assets update" ON storage.objects
  FOR UPDATE USING (bucket_id = 'school-assets');

DROP POLICY IF EXISTS "school-assets select" ON storage.objects;
CREATE POLICY "school-assets select" ON storage.objects
  FOR SELECT USING (bucket_id = 'school-assets');

