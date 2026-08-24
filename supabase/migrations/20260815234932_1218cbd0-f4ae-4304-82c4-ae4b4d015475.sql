-- 1) Invitation tokens + expiry
ALTER TABLE public.team_invitations
  ADD COLUMN IF NOT EXISTS token text NOT NULL DEFAULT encode(gen_random_bytes(24), 'hex'),
  ADD COLUMN IF NOT EXISTS expires_at timestamptz NOT NULL DEFAULT (now() + interval '7 days'),
  ADD COLUMN IF NOT EXISTS accepted_at timestamptz,
  ADD COLUMN IF NOT EXISTS accepted_by uuid,
  ADD COLUMN IF NOT EXISTS email_sent_at timestamptz;

CREATE UNIQUE INDEX IF NOT EXISTS team_invitations_token_key ON public.team_invitations (token);

-- 2) Workspace owner becomes org_admin automatically
CREATE OR REPLACE FUNCTION public.grant_org_admin_to_owner()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.owner_id IS NOT NULL THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.owner_id, 'org_admin')
    ON CONFLICT (user_id, role) DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_grant_org_admin_to_owner ON public.organizations;
CREATE TRIGGER trg_grant_org_admin_to_owner
AFTER INSERT ON public.organizations
FOR EACH ROW EXECUTE FUNCTION public.grant_org_admin_to_owner();

-- 3) Helper: is this user the admin/owner of their organization?
CREATE OR REPLACE FUNCTION public.is_org_admin(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.has_role(_user_id, 'org_admin')
     OR public.has_role(_user_id, 'founder_admin')
     OR EXISTS (
       SELECT 1 FROM public.organizations o
       WHERE o.owner_id = _user_id
         AND o.id = public.get_user_org_id(_user_id)
     );
$$;