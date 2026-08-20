
CREATE OR REPLACE FUNCTION public.admin_email_health_stats(
  p_start TIMESTAMPTZ,
  p_end TIMESTAMPTZ,
  p_templates TEXT[] DEFAULT NULL,
  p_status TEXT DEFAULT NULL
)
RETURNS TABLE (status TEXT, cnt BIGINT)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.is_founder_admin(auth.uid()) THEN
    RAISE EXCEPTION 'not authorized';
  END IF;

  RETURN QUERY
  WITH latest AS (
    SELECT DISTINCT ON (l.message_id) l.*
    FROM public.email_send_log l
    WHERE l.message_id IS NOT NULL
    ORDER BY l.message_id, l.created_at DESC
  )
  SELECT latest.status, count(*)::BIGINT
  FROM latest
  WHERE latest.created_at >= p_start
    AND latest.created_at <= p_end
    AND (p_templates IS NULL OR latest.template_name = ANY(p_templates))
    AND (p_status IS NULL OR latest.status = p_status)
  GROUP BY latest.status;
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_email_health_log(
  p_start TIMESTAMPTZ,
  p_end TIMESTAMPTZ,
  p_templates TEXT[] DEFAULT NULL,
  p_status TEXT DEFAULT NULL,
  p_limit INT DEFAULT 50,
  p_offset INT DEFAULT 0
)
RETURNS TABLE (
  id UUID,
  message_id TEXT,
  template_name TEXT,
  recipient_email TEXT,
  status TEXT,
  error_message TEXT,
  created_at TIMESTAMPTZ,
  total_count BIGINT
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.is_founder_admin(auth.uid()) THEN
    RAISE EXCEPTION 'not authorized';
  END IF;

  RETURN QUERY
  WITH latest AS (
    SELECT DISTINCT ON (l.message_id) l.*
    FROM public.email_send_log l
    WHERE l.message_id IS NOT NULL
    ORDER BY l.message_id, l.created_at DESC
  ), filtered AS (
    SELECT * FROM latest
    WHERE latest.created_at >= p_start
      AND latest.created_at <= p_end
      AND (p_templates IS NULL OR latest.template_name = ANY(p_templates))
      AND (p_status IS NULL OR latest.status = p_status)
  )
  SELECT f.id, f.message_id, f.template_name, f.recipient_email, f.status,
         f.error_message, f.created_at,
         (SELECT count(*) FROM filtered)::BIGINT
  FROM filtered f
  ORDER BY f.created_at DESC
  LIMIT LEAST(GREATEST(p_limit, 1), 200) OFFSET GREATEST(p_offset, 0);
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_email_templates()
RETURNS TABLE (template_name TEXT)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.is_founder_admin(auth.uid()) THEN
    RAISE EXCEPTION 'not authorized';
  END IF;

  RETURN QUERY
  SELECT DISTINCT l.template_name
  FROM public.email_send_log l
  ORDER BY 1;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.admin_email_health_stats(TIMESTAMPTZ, TIMESTAMPTZ, TEXT[], TEXT) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.admin_email_health_log(TIMESTAMPTZ, TIMESTAMPTZ, TEXT[], TEXT, INT, INT) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.admin_email_templates() FROM anon, public;
GRANT EXECUTE ON FUNCTION public.admin_email_health_stats(TIMESTAMPTZ, TIMESTAMPTZ, TEXT[], TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_email_health_log(TIMESTAMPTZ, TIMESTAMPTZ, TEXT[], TEXT, INT, INT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_email_templates() TO authenticated;
