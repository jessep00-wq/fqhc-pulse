
-- Create sites table for multi-site FQHCs
CREATE TABLE public.sites (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL,
  name TEXT NOT NULL,
  address TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.sites ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read org sites" ON public.sites
  FOR SELECT TO authenticated
  USING (organization_id = get_user_org_id(auth.uid()));

CREATE POLICY "Users can insert org sites" ON public.sites
  FOR INSERT TO authenticated
  WITH CHECK (organization_id = get_user_org_id(auth.uid()));

CREATE POLICY "Users can update org sites" ON public.sites
  FOR UPDATE TO authenticated
  USING (organization_id = get_user_org_id(auth.uid()));

CREATE POLICY "Users can delete org sites" ON public.sites
  FOR DELETE TO authenticated
  USING (organization_id = get_user_org_id(auth.uid()));

-- Add optional site_id to pdsa_cycles
ALTER TABLE public.pdsa_cycles ADD COLUMN site_id UUID REFERENCES public.sites(id) ON DELETE SET NULL;

-- Add optional site_id to tasks
ALTER TABLE public.tasks ADD COLUMN site_id UUID REFERENCES public.sites(id) ON DELETE SET NULL;

-- Add optional site_id to uds_trends
ALTER TABLE public.uds_trends ADD COLUMN site_id UUID REFERENCES public.sites(id) ON DELETE SET NULL;

-- Add optional site_id to org_financials
ALTER TABLE public.org_financials ADD COLUMN site_id UUID REFERENCES public.sites(id) ON DELETE SET NULL;
