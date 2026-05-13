DROP TRIGGER IF EXISTS on_org_created_subscription ON public.organizations;
DROP TRIGGER IF EXISTS on_organization_created_subscription ON public.organizations;

CREATE OR REPLACE FUNCTION public.handle_new_org_subscription()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.subscriptions (organization_id, plan, status, trial_end)
  VALUES (NEW.id, 'free', 'trialing', now() + INTERVAL '14 days')
  ON CONFLICT (organization_id) DO NOTHING;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_org_created_subscription
AFTER INSERT ON public.organizations
FOR EACH ROW
EXECUTE FUNCTION public.handle_new_org_subscription();