-- 1. Replace the org-only unique constraint with one scoped per environment
ALTER TABLE public.subscriptions
  DROP CONSTRAINT IF EXISTS subscriptions_organization_id_key;

DROP INDEX IF EXISTS public.subscriptions_organization_id_key;

CREATE UNIQUE INDEX IF NOT EXISTS subscriptions_org_env_key
  ON public.subscriptions (organization_id, environment);

-- 2. Harden trial provisioning: seed BOTH sandbox and live trial rows
CREATE OR REPLACE FUNCTION public.handle_new_org_subscription()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO public.subscriptions (organization_id, plan, status, trial_end, environment)
  VALUES
    (NEW.id, 'free', 'trialing', now() + INTERVAL '14 days', 'sandbox'),
    (NEW.id, 'free', 'trialing', now() + INTERVAL '14 days', 'live')
  ON CONFLICT (organization_id, environment) DO NOTHING;
  RETURN NEW;
END;
$function$;

DROP TRIGGER IF EXISTS on_org_created_subscription ON public.organizations;
DROP TRIGGER IF EXISTS on_organization_created_subscription ON public.organizations;
CREATE TRIGGER on_org_created_subscription
AFTER INSERT ON public.organizations
FOR EACH ROW
EXECUTE FUNCTION public.handle_new_org_subscription();

-- 3. Backfill: ensure every existing org has a trial row for BOTH environments.
-- For orgs with no rows at all, give a fresh 14-day trial in both envs.
INSERT INTO public.subscriptions (organization_id, plan, status, trial_end, environment)
SELECT o.id, 'free', 'trialing', now() + INTERVAL '14 days', e.env
FROM public.organizations o
CROSS JOIN (VALUES ('sandbox'), ('live')) AS e(env)
WHERE NOT EXISTS (
  SELECT 1 FROM public.subscriptions s
  WHERE s.organization_id = o.id AND s.environment = e.env
)
ON CONFLICT (organization_id, environment) DO NOTHING;

-- 4. Update org_access_status to honor a trial in either environment
CREATE OR REPLACE FUNCTION public.org_access_status(_org_id uuid)
RETURNS text
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT CASE
    WHEN EXISTS (
      SELECT 1 FROM public.subscriptions
      WHERE organization_id = _org_id
        AND plan <> 'free'
        AND status IN ('active','trialing','past_due')
        AND (current_period_end IS NULL OR current_period_end > now())
    ) THEN 'active'
    WHEN EXISTS (
      SELECT 1 FROM public.subscriptions
      WHERE organization_id = _org_id
        AND plan = 'free'
        AND trial_end IS NOT NULL
        AND trial_end > now()
    ) THEN 'trialing'
    ELSE 'locked'
  END;
$function$;