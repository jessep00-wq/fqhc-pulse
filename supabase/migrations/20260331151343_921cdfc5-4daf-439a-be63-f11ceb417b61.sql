CREATE TABLE public.org_financials (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL,
  shared_savings numeric NOT NULL DEFAULT 0,
  revenue_protected numeric NOT NULL DEFAULT 0,
  hrsa_quality_award numeric NOT NULL DEFAULT 0,
  trend numeric NOT NULL DEFAULT 0,
  grant_trend numeric NOT NULL DEFAULT 0,
  period text NOT NULL DEFAULT 'Q1 2026',
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.org_financials ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can read org financials" ON public.org_financials FOR SELECT TO authenticated USING (organization_id = get_user_org_id(auth.uid()));
CREATE POLICY "Users can insert org financials" ON public.org_financials FOR INSERT TO authenticated WITH CHECK (organization_id = get_user_org_id(auth.uid()));
CREATE POLICY "Users can update org financials" ON public.org_financials FOR UPDATE TO authenticated USING (organization_id = get_user_org_id(auth.uid()));