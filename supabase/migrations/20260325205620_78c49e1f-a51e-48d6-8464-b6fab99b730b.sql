
-- Organizations table
CREATE TABLE public.organizations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  npi text,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;

-- Profiles table
CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  organization_id uuid REFERENCES public.organizations(id),
  full_name text,
  staff_role text CHECK (staff_role IN ('Front Desk', 'MA/RN', 'Provider', 'Care Coordinator', 'QI Manager')),
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- PDSA Cycles table
CREATE TABLE public.pdsa_cycles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id),
  title text NOT NULL,
  status text NOT NULL DEFAULT 'plan' CHECK (status IN ('plan', 'do', 'study', 'act', 'completed')),
  uds_measure text,
  root_cause text,
  target_goal text,
  clinical_workflow_impact text,
  assigned_staff text[] DEFAULT '{}',
  improvement_pct integer,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.pdsa_cycles ENABLE ROW LEVEL SECURITY;

-- Tasks table
CREATE TABLE public.tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id),
  pdsa_cycle_id uuid REFERENCES public.pdsa_cycles(id) ON DELETE CASCADE,
  title text NOT NULL,
  assigned_role text,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'overdue')),
  due_date date,
  acknowledged boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;

-- UDS Trends table
CREATE TABLE public.uds_trends (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id),
  month text NOT NULL,
  measure_id text NOT NULL,
  value numeric NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.uds_trends ENABLE ROW LEVEL SECURITY;

-- Activity Log table
CREATE TABLE public.activity_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id),
  text text NOT NULL,
  type text NOT NULL DEFAULT 'info' CHECK (type IN ('success', 'warning', 'info')),
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.activity_log ENABLE ROW LEVEL SECURITY;

-- Security definer function to get user's org_id (avoids RLS recursion)
CREATE OR REPLACE FUNCTION public.get_user_org_id(_user_id uuid)
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT organization_id FROM public.profiles WHERE id = _user_id
$$;

-- Auto-create profile on signup trigger
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', ''));
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- RLS Policies for profiles (own row only)
CREATE POLICY "Users can read own profile" ON public.profiles
  FOR SELECT TO authenticated USING (id = auth.uid());
CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE TO authenticated USING (id = auth.uid());

-- RLS Policies for organizations
CREATE POLICY "Users can read own org" ON public.organizations
  FOR SELECT TO authenticated USING (id = public.get_user_org_id(auth.uid()));

-- RLS Policies for pdsa_cycles
CREATE POLICY "Users can read org cycles" ON public.pdsa_cycles
  FOR SELECT TO authenticated USING (organization_id = public.get_user_org_id(auth.uid()));
CREATE POLICY "Users can insert org cycles" ON public.pdsa_cycles
  FOR INSERT TO authenticated WITH CHECK (organization_id = public.get_user_org_id(auth.uid()));
CREATE POLICY "Users can update org cycles" ON public.pdsa_cycles
  FOR UPDATE TO authenticated USING (organization_id = public.get_user_org_id(auth.uid()));

-- RLS Policies for tasks
CREATE POLICY "Users can read org tasks" ON public.tasks
  FOR SELECT TO authenticated USING (organization_id = public.get_user_org_id(auth.uid()));
CREATE POLICY "Users can insert org tasks" ON public.tasks
  FOR INSERT TO authenticated WITH CHECK (organization_id = public.get_user_org_id(auth.uid()));
CREATE POLICY "Users can update org tasks" ON public.tasks
  FOR UPDATE TO authenticated USING (organization_id = public.get_user_org_id(auth.uid()));

-- RLS Policies for uds_trends
CREATE POLICY "Users can read org trends" ON public.uds_trends
  FOR SELECT TO authenticated USING (organization_id = public.get_user_org_id(auth.uid()));
CREATE POLICY "Users can insert org trends" ON public.uds_trends
  FOR INSERT TO authenticated WITH CHECK (organization_id = public.get_user_org_id(auth.uid()));

-- RLS Policies for activity_log
CREATE POLICY "Users can read org activity" ON public.activity_log
  FOR SELECT TO authenticated USING (organization_id = public.get_user_org_id(auth.uid()));
CREATE POLICY "Users can insert org activity" ON public.activity_log
  FOR INSERT TO authenticated WITH CHECK (organization_id = public.get_user_org_id(auth.uid()));
