
-- Founder admins can read all organizations
CREATE POLICY "Founder admins can read all orgs"
ON public.organizations FOR SELECT TO authenticated
USING (public.is_founder_admin(auth.uid()));

-- Founder admins can read all profiles
CREATE POLICY "Founder admins can read all profiles"
ON public.profiles FOR SELECT TO authenticated
USING (public.is_founder_admin(auth.uid()));

-- Founder admins can read all PDSA cycles
CREATE POLICY "Founder admins can read all cycles"
ON public.pdsa_cycles FOR SELECT TO authenticated
USING (public.is_founder_admin(auth.uid()));

-- Founder admins can read all usage events
-- (already exists from previous migration)

-- Founder admins can read all tasks
CREATE POLICY "Founder admins can read all tasks"
ON public.tasks FOR SELECT TO authenticated
USING (public.is_founder_admin(auth.uid()));
