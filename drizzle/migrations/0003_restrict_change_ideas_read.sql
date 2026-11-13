DROP POLICY IF EXISTS change_ideas_read_authenticated ON public.change_ideas;
CREATE POLICY change_ideas_read_org_members
  ON public.change_ideas
  FOR SELECT
  TO authenticated
  USING (
    public.get_user_org_id(auth.uid()) IS NOT NULL
    OR public.is_founder_admin(auth.uid())
  );