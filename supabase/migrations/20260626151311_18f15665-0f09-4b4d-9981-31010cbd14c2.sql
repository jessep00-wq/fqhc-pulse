
-- qi_oversight_roles
CREATE TABLE IF NOT EXISTS public.qi_oversight_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  area TEXT NOT NULL,
  owner_role TEXT,
  owner_name_override TEXT,
  review_frequency TEXT,
  documentation_location TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.qi_oversight_roles TO authenticated;
GRANT ALL ON public.qi_oversight_roles TO service_role;

ALTER TABLE public.qi_oversight_roles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Org members manage oversight roles"
  ON public.qi_oversight_roles FOR ALL TO authenticated
  USING (
    organization_id IN (SELECT organization_id FROM public.profiles WHERE id = auth.uid())
    OR public.has_role(auth.uid(), 'founder_admin')
  )
  WITH CHECK (
    organization_id IN (SELECT organization_id FROM public.profiles WHERE id = auth.uid())
    OR public.has_role(auth.uid(), 'founder_admin')
  );

CREATE INDEX IF NOT EXISTS idx_qi_oversight_roles_org ON public.qi_oversight_roles(organization_id);

-- qi_meetings
CREATE TABLE IF NOT EXISTS public.qi_meetings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  site_id UUID REFERENCES public.sites(id) ON DELETE SET NULL,
  meeting_date DATE NOT NULL,
  chair_name TEXT,
  attendees TEXT[] NOT NULL DEFAULT '{}',
  agenda_summary TEXT[] NOT NULL DEFAULT '{}',
  key_decisions TEXT[] NOT NULL DEFAULT '{}',
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.qi_meetings TO authenticated;
GRANT ALL ON public.qi_meetings TO service_role;

ALTER TABLE public.qi_meetings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Org members manage qi meetings"
  ON public.qi_meetings FOR ALL TO authenticated
  USING (
    organization_id IN (SELECT organization_id FROM public.profiles WHERE id = auth.uid())
    OR public.has_role(auth.uid(), 'founder_admin')
  )
  WITH CHECK (
    organization_id IN (SELECT organization_id FROM public.profiles WHERE id = auth.uid())
    OR public.has_role(auth.uid(), 'founder_admin')
  );

CREATE INDEX IF NOT EXISTS idx_qi_meetings_org_date ON public.qi_meetings(organization_id, meeting_date DESC);
