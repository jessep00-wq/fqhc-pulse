
-- Subscriptions table
CREATE TABLE public.subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL,
  plan TEXT NOT NULL DEFAULT 'free',
  status TEXT NOT NULL DEFAULT 'trialing',
  trial_end TIMESTAMPTZ,
  renews_at TIMESTAMPTZ,
  canceled_at TIMESTAMPTZ,
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (organization_id)
);

ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Org members can read own subscription"
ON public.subscriptions FOR SELECT TO authenticated
USING (organization_id = get_user_org_id(auth.uid()));

CREATE POLICY "Founder admins can read all subscriptions"
ON public.subscriptions FOR SELECT TO authenticated
USING (public.is_founder_admin(auth.uid()));

CREATE POLICY "Founder admins can insert subscriptions"
ON public.subscriptions FOR INSERT TO authenticated
WITH CHECK (public.is_founder_admin(auth.uid()));

CREATE POLICY "Founder admins can update subscriptions"
ON public.subscriptions FOR UPDATE TO authenticated
USING (public.is_founder_admin(auth.uid()));

-- Usage events table
CREATE TABLE public.usage_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL,
  user_id UUID NOT NULL,
  event_name TEXT NOT NULL,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.usage_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can insert own events"
ON public.usage_events FOR INSERT TO authenticated
WITH CHECK (user_id = auth.uid() AND organization_id = get_user_org_id(auth.uid()));

CREATE POLICY "Founder admins can read all events"
ON public.usage_events FOR SELECT TO authenticated
USING (public.is_founder_admin(auth.uid()));

-- Index for querying recent events by org
CREATE INDEX idx_usage_events_org_created ON public.usage_events (organization_id, created_at DESC);
CREATE INDEX idx_usage_events_event_name ON public.usage_events (event_name);

-- Account health snapshots
CREATE TABLE public.account_health_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL,
  period DATE NOT NULL DEFAULT CURRENT_DATE,
  weekly_active_users INT NOT NULL DEFAULT 0,
  active_pdsa_count INT NOT NULL DEFAULT 0,
  last_export_at TIMESTAMPTZ,
  health_status TEXT NOT NULL DEFAULT 'green',
  risk_flag TEXT,
  onboarding_complete BOOLEAN NOT NULL DEFAULT false,
  first_pdsa_done BOOLEAN NOT NULL DEFAULT false,
  champion_user_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (organization_id, period)
);

ALTER TABLE public.account_health_snapshots ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Founder admins can read all health snapshots"
ON public.account_health_snapshots FOR SELECT TO authenticated
USING (public.is_founder_admin(auth.uid()));

CREATE POLICY "Founder admins can insert health snapshots"
ON public.account_health_snapshots FOR INSERT TO authenticated
WITH CHECK (public.is_founder_admin(auth.uid()));

CREATE POLICY "Founder admins can update health snapshots"
ON public.account_health_snapshots FOR UPDATE TO authenticated
USING (public.is_founder_admin(auth.uid()));

-- Auto-create free subscription when org is created
CREATE OR REPLACE FUNCTION public.handle_new_org_subscription()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.subscriptions (organization_id, plan, status, trial_end)
  VALUES (NEW.id, 'free', 'active', NULL);
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_org_created_subscription
AFTER INSERT ON public.organizations
FOR EACH ROW
EXECUTE FUNCTION public.handle_new_org_subscription();

-- Revoke anon access on new function
REVOKE EXECUTE ON FUNCTION public.handle_new_org_subscription() FROM anon;
