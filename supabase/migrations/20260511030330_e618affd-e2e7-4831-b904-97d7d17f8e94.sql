-- Backfill trial_end for existing free subscription rows
UPDATE public.subscriptions
SET trial_end = created_at + INTERVAL '14 days'
WHERE plan = 'free' AND trial_end IS NULL;

-- Update trigger function to seed a 14-day trial on new orgs
CREATE OR REPLACE FUNCTION public.handle_new_org_subscription()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO public.subscriptions (organization_id, plan, status, trial_end)
  VALUES (NEW.id, 'free', 'trialing', now() + INTERVAL '14 days');
  RETURN NEW;
END;
$function$;

-- Ensure trigger exists on organizations
DROP TRIGGER IF EXISTS on_organization_created_subscription ON public.organizations;
CREATE TRIGGER on_organization_created_subscription
AFTER INSERT ON public.organizations
FOR EACH ROW
EXECUTE FUNCTION public.handle_new_org_subscription();

-- Helper: returns 'active' | 'trialing' | 'locked' for an org
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