-- ==============================================================================
-- Privacy-Preserving School Search (Zero Full Directory Exposure)
-- ==============================================================================

-- Search Schools strictly matching query with minimum 3 characters
CREATE OR REPLACE FUNCTION public.search_schools(p_query TEXT)
RETURNS TABLE (
  id UUID,
  name VARCHAR(200),
  code VARCHAR(50),
  city VARCHAR(100),
  state VARCHAR(100)
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_cleaned TEXT;
BEGIN
  v_cleaned := TRIM(COALESCE(p_query, ''));

  -- Enforce minimum 3 characters requirement
  IF LENGTH(v_cleaned) < 3 THEN
    RETURN;
  END IF;

  RETURN QUERY
  SELECT 
    s.id,
    s.name,
    s.code,
    s.city,
    s.state
  FROM public.schools s
  WHERE s.status = 'ACTIVE'
    AND UPPER(s.code) != 'PLATFORM'
    AND s.name ILIKE '%' || v_cleaned || '%'
  ORDER BY 
    -- Prioritize exact prefix match
    CASE WHEN s.name ILIKE v_cleaned || '%' THEN 1 ELSE 2 END,
    s.name ASC
  LIMIT 5;
END;
$$;

-- Grant access to search_schools
GRANT EXECUTE ON FUNCTION public.search_schools(TEXT) TO anon, authenticated;

-- Drop/Revoke public directory function to prevent competitor sniffing
REVOKE EXECUTE ON FUNCTION public.get_public_school_directory() FROM anon, authenticated;
